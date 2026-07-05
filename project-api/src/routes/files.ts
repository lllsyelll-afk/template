import { Hono } from "hono";
import { z } from "zod";
import type { Repositories } from "../types";
import { requireAuth, type AppEnv } from "../middleware/auth";
import { getDefaultStorage } from "../storage";
import { AppError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";
import { compressImage } from "../utils/image";

// ============================================================================
// FILE PERMISSION SYSTEM
// ============================================================================

// Maximum upload size for photos (5MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 5MB in bytes

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

type PermissionRequirement =
  | { any: true }
  | { authenticated: true }
  | { owner: true }
  | { roles: string[] };

interface PermissionRule {
  pattern: string;
  permission: PermissionRequirement;
}

interface FilePermissionConfig {
  default: PermissionRequirement;
  rules: PermissionRule[];
}

/**
 * File permission configuration
 * Rules are evaluated in order - first match wins
 * Default policy applies if no rules match
 */
const FILE_PERMISSIONS: FilePermissionConfig = {
  default: { any: true }, // Public access by default
  rules: [
    // Future rules can be added here:
    // { pattern: '/uploads/users/*', permission: { authenticated: true } },
    // { pattern: '/uploads/admin/*', permission: { roles: ['admin'] } },
  ],
};

/**
 * Match a file path against a permission pattern
 * Supports wildcards: * matches any single path segment
 */
function matchPathPattern(filePath: string, pattern: string): boolean {
  // Normalize paths
  const normalizedPath = filePath.replace(/^\/+/, '');
  const normalizedPattern = pattern.replace(/^\/+/, '');

  // Exact match
  if (normalizedPath === normalizedPattern) {
    return true;
  }

  // Split into segments
  const pathSegments = normalizedPath.split('/');
  const patternSegments = normalizedPattern.split('/');

  // If pattern ends with *, it matches any file in that directory
  if (normalizedPattern.endsWith('/*')) {
    const basePattern = normalizedPattern.slice(0, -2); // Remove /*
    return normalizedPath.startsWith(basePattern + '/');
  }

  // Segment-by-segment matching with * wildcard support
  if (patternSegments.length !== pathSegments.length) {
    return false;
  }

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSeg = patternSegments[i];
    const pathSeg = pathSegments[i];

    if (patternSeg === '*') {
      // Wildcard matches any single segment
      continue;
    }

    if (patternSeg !== pathSeg) {
      return false;
    }
  }

  return true;
}

/**
 * Get the required permission for a file path
 */
function getRequiredPermission(filePath: string): PermissionRequirement {
  // Check rules in order - first match wins
  for (const rule of FILE_PERMISSIONS.rules) {
    if (matchPathPattern(filePath, rule.pattern)) {
      return rule.permission;
    }
  }

  // Return default if no rules match
  return FILE_PERMISSIONS.default;
}

/**
 * Check if the current request has permission to access the file
 */
async function hasPermission(
  c: { get: (key: 'auth') => { user?: { _id: string; permissions?: string[] } } | undefined },
  filePath: string,
  _repos: Repositories
): Promise<{ allowed: boolean; error?: string }> {
  const required = getRequiredPermission(filePath);

  // Public access - no check needed
  if ('any' in required && required.any) {
    return { allowed: true };
  }

  // Authenticated access - check for valid token
  if ('authenticated' in required && required.authenticated) {
    const auth = c.get('auth');
    if (!auth?.user) {
      return { allowed: false, error: 'authentication_required' };
    }
    return { allowed: true };
  }

  // Owner access - check if user owns the file (future implementation)
  if ('owner' in required && required.owner) {
    // For now, require authentication
    const auth = c.get('auth');
    if (!auth?.user) {
      return { allowed: false, error: 'authentication_required' };
    }
    // TODO: Implement ownership check based on file path
    return { allowed: true };
  }

  // Role-based access (future implementation)
  if ('roles' in required && required.roles) {
    const auth = c.get('auth');
    if (!auth?.user) {
      return { allowed: false, error: 'authentication_required' };
    }
    // TODO: Implement role checking
    return { allowed: true };
  }

  return { allowed: false, error: 'unknown_permission_type' };
}

const querySchema = z.object({
  path: z.string().min(1),
});

// Map common image extensions to content types — only images are allowed for public serving
const contentTypeMap: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  return contentTypeMap[ext] || "application/octet-stream";
}

/**
 * Sanitize file path to prevent directory traversal attacks
 * - Removes .. sequences
 * - Removes leading slashes
 * - Only allows alphanumeric, dots, hyphens, underscores, and forward slashes
 * - Limits path depth to prevent deep directory traversal
 */
function sanitizePath(filePath: string): string | null {
  // Remove null bytes and control characters manually
  let cleaned = '';
  for (let i = 0; i < filePath.length; i++) {
    const char = filePath[i];
    const code = char.charCodeAt(0);
    if (code === 0 || (code >= 1 && code <= 31) || code === 127) {
      continue;
    }
    cleaned += char;
  }

  // Remove any leading/trailing slashes to prevent absolute paths
  const normalized = cleaned.replace(/^[\/]+|[\/]+$/g, '');

  // Split into segments and validate each one
  const segments = normalized.split('/').filter((s) => s.length > 0);
  if (segments.length === 0 || segments.length > 10) {
    return null;
  }

  const safeSegments: string[] = [];
  for (const seg of segments) {
    // Reject traversal segments and hidden files
    if (seg === '.' || seg === '..' || seg.startsWith('.')) {
      return null;
    }
    // Only allow safe characters in each segment
    const safe = seg.replace(/[^a-zA-Z0-9._\-]/g, '');
    if (safe.length === 0 || safe.length !== seg.length) {
      return null;
    }
    safeSegments.push(safe);
  }

  return safeSegments.join('/');
}

/**
 * Validate that the file extension is allowed
 */
function isAllowedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  const allowedExtensions = Object.keys(contentTypeMap);
  return allowedExtensions.includes(ext) || ext === '';
}

export function createFilesRoutes(repos: Repositories) {
  const r = new Hono<AppEnv>();
  const storage = getDefaultStorage();
  const isDev = process.env.ENV === "development";

  // File serving endpoint - PUBLIC (no auth required for images)
  r.get("/", async (c) => {
    const query = c.req.query();
    const parsed = querySchema.safeParse(query);

    if (!parsed.success) {
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    }

    const filePath = parsed.data.path;

    // Sanitize the file path to prevent directory traversal
    const sanitizedPath = sanitizePath(filePath);
    if (!sanitizedPath) {
      throw new AppError(ErrorCode.INVALID_FILE_PATH, 400, { path: filePath });
    }

    // Validate file extension is allowed
    if (!isAllowedExtension(sanitizedPath)) {
      throw new AppError(ErrorCode.FILE_TYPE_NOT_ALLOWED, 400, { path: sanitizedPath });
    }

    // Check file access permissions
    const permissionCheck = await hasPermission(c, sanitizedPath, repos);
    if (!permissionCheck.allowed) {
      throw new AppError(ErrorCode.ACCESS_DENIED, 403, { message: permissionCheck.error });
    }

    try {
      // Check if file exists
      const exists = await storage.exists(sanitizedPath);

      if (!exists) {
        throw new AppError(ErrorCode.FILE_NOT_FOUND, 404, { path: sanitizedPath });
      }

      // Download file
      const buffer = await storage.download(sanitizedPath);
      const contentType = getContentType(sanitizedPath);

      // Set headers and return file
      c.header("Content-Type", contentType);
      return c.body(new Uint8Array(buffer));
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error("[files] error serving file:", err);
      throw new AppError(ErrorCode.FILE_ERROR, 500, { message: isDev ? (err as Error).message : "Failed to serve file" });
    }
  });

  // Protected routes - require authentication
  const protectedRoutes = new Hono<AppEnv>();
  protectedRoutes.use("*", requireAuth(repos));

  protectedRoutes.get("/download-url", async (c) => {
    const query = c.req.query();
    const parsed = querySchema.safeParse(query);

    if (!parsed.success) {
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    }

    const filePath = parsed.data.path;

    try {
      const url = await storage.getDownloadUrl(filePath);
      return c.json({ url });
    } catch (err) {
      console.error("[files] error generating download URL:", err);
      throw new AppError(ErrorCode.FILE_ERROR, 500, { message: (err as Error).message });
    }
  });

  // Upload endpoint for base64 files (e.g., user photos)
  const uploadSchema = z.object({
    data: z.string().min(1), // base64 data URL
    folder: z.string().min(1).default("uploads"),
    filename: z.string().optional(),
  });

  protectedRoutes.post("/upload", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = uploadSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(ErrorCode.VALIDATION, 400, {
        details: parsed.error.flatten(),
      });
    }

    const { data, folder, filename } = parsed.data;

    try {
      // Parse base64 data URL (handles optional params like ;name=...)
      const match = data.match(/^data:([\w/]+)(?:;[^,]+)?;base64,(.+)$/);
      if (!match) {
        console.error(
          "[files] invalid data URL format, received:",
          data.slice(0, 100),
        );
        throw new AppError(ErrorCode.VALIDATION, 400, { message: "Invalid base64 data URL format" });
      }

      const mimeType = match[1];
      const base64Content = match[2];

      // Validate MIME type - only allow images
      if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
        throw new AppError(ErrorCode.INVALID_FILE_TYPE, 400, {
          message: `Only images are allowed (${ALLOWED_IMAGE_TYPES.join(", ")})`,
          receivedType: mimeType,
        });
      }

      const buffer = Buffer.from(base64Content, "base64");

      // Validate file size to prevent memory exhaustion and DoS attacks
      if (buffer.length > MAX_FILE_SIZE) {
        throw new AppError(ErrorCode.FILE_TOO_LARGE, 413, {
          message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          size: buffer.length,
          maxSize: MAX_FILE_SIZE,
        });
      }

      // Compress image before upload
      const compressed = await compressImage(buffer);

      // Generate filename with timestamp
      const timestamp = Date.now();
      const ext = "jpg";
      // Sanitize filename - remove special chars that could cause path issues
      const safeFilename = filename
        ? filename.replace(/[^a-zA-Z0-9_-]/g, "")
        : null;
      const finalFilename = safeFilename
        ? `${safeFilename}_${timestamp}.${ext}`
        : `file_${timestamp}.${ext}`;

      const safeFolder = sanitizePath(folder);
      if (!safeFolder) {
        throw new AppError(ErrorCode.INVALID_FOLDER, 400, { message: "Invalid upload folder" });
      }
      const filePath = `${safeFolder}/${finalFilename}`;

      console.log("[files] uploading to:", filePath, "size:", compressed.length);

      // Upload to storage
      await storage.upload(filePath, compressed);

      // Return the storage path (can be used with /files?path=)
      return c.json({
        path: filePath,
        url: storage.getPublicUrl(filePath),
        mimeType: "image/jpeg",
        size: compressed.length,
      });
    } catch (err) {
      const errorMessage = (err as Error).message;
      const errorStack = (err as Error).stack;
      console.error("[files] error uploading file:", errorMessage);
      console.error("[files] error stack:", errorStack);
      throw new AppError(ErrorCode.UPLOAD_FAILED, 500, { message: isDev ? errorMessage : "Failed to upload file" });
    }
  });

  // Mount protected routes
  r.route("/", protectedRoutes);

  return r;
}
