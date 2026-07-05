import type { MiddlewareHandler } from "hono";
import type { Repositories } from "../types";
import type { AppEnv } from "./auth";
import { isValidObjectId } from "../utils/sanitize";

const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

const SENSITIVE_KEYS = /^(password|token|secret|otp|newPassword|currentPassword|code)$/i;

function sanitizeBody(body: unknown): unknown {
  if (body === null || body === undefined) return undefined;
  if (typeof body !== "object") return body;
  if (Array.isArray(body)) return body.map(sanitizeBody);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.test(key)) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeBody(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function getClientIP(c: Parameters<MiddlewareHandler<AppEnv>>[0]): string {
  const incoming = (
    c as unknown as { env?: { incoming?: import("http").IncomingMessage } }
  ).env?.incoming;
  const addr = incoming?.socket?.remoteAddress;
  if (!addr) return "unknown";
  return addr.startsWith("::ffff:") ? addr.slice(7) : addr;
}

export function auditLog(repos: Repositories): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const method = c.req.method;
    if (!MUTATING_METHODS.has(method)) {
      return next();
    }

    let body: unknown = undefined;
    try {
      const raw = await c.req.text();
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = undefined;
        }
      }
    } catch {
      // No body or already consumed
    }

    await next();

    const auth = c.get("auth");
    if (!auth) return;

    const path = c.req.path;
    const segments = path.split("/").filter(Boolean);
    // Path is like /api/admin/users/abc123/block
    // Find resource: the segment after "admin"
    const adminIdx = segments.indexOf("admin");
    const resource = adminIdx >= 0 && segments[adminIdx + 1]
      ? segments[adminIdx + 1]
      : segments[0] || "unknown";
    // Find targetId: first ObjectId-like segment after the resource
    let targetId: string | undefined;
    for (let i = adminIdx + 2; i < segments.length; i++) {
      if (isValidObjectId(segments[i])) {
        targetId = segments[i];
        break;
      }
    }

    const sanitizedBody = sanitizeBody(body);

    repos.auditLogs
      .create({
        adminId: auth.user._id,
        adminName: auth.user.name,
        action: method,
        method,
        path,
        resource,
        targetId,
        body: sanitizedBody,
        status: c.res.status,
        ip: getClientIP(c),
      })
      .catch((err) => console.error("[audit]", err));
  };
}
