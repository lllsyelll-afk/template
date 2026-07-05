// Local filesystem storage adapter
import * as fs from "fs";
import * as path from "path";
import type { FileStorageAdapter } from "./types";

export interface LocalStorageConfig {
  basePath: string;
  baseUrl?: string; // Optional base URL for full download URLs
}

export class LocalFileStorage implements FileStorageAdapter {
  private basePath: string;
  private baseUrl: string;

  constructor(config: LocalStorageConfig) {
    // Resolve to absolute path for consistent comparison
    this.basePath = path.resolve(config.basePath);
    this.baseUrl = config.baseUrl || "";
    // Ensure base directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  private resolvePath(filePath: string): string {
    // Prevent directory traversal attacks
    const resolved = path.resolve(this.basePath, filePath);
    // Use consistent path separators for comparison (important on Windows)
    const normalizedResolved = path.normalize(resolved).replace(/\\/g, "/");
    // Ensure base path has trailing separator for proper prefix check
    let normalizedBase = path.normalize(this.basePath).replace(/\\/g, "/");
    if (!normalizedBase.endsWith("/")) {
      normalizedBase += "/";
    }
    if (
      !normalizedResolved.startsWith(normalizedBase) &&
      normalizedResolved !== normalizedBase.slice(0, -1)
    ) {
      throw new Error("Invalid path: directory traversal detected");
    }
    return resolved;
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = this.resolvePath(filePath);
    return fs.promises.readFile(fullPath);
  }

  async upload(filePath: string, file: Buffer | Blob): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    // Ensure parent directory exists
    const dir = path.dirname(fullPath);
    await fs.promises.mkdir(dir, { recursive: true });

    let buffer: Buffer;
    if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    await fs.promises.writeFile(fullPath, buffer);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    try {
      await fs.promises.unlink(fullPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
      // File doesn't exist, treat as success
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getDownloadUrl(filePath: string): Promise<string> {
    const exists = await this.exists(filePath);
    if (!exists) {
      throw new Error("File not found");
    }
    return this.getPublicUrl(filePath);
  }

  getPublicUrl(filePath: string): string {
    const prefix = this.baseUrl || "";
    return `${prefix}/api/files?path=${encodeURIComponent(filePath)}`;
  }

  getBasePath(): string {
    return this.basePath;
  }

  async check(): Promise<boolean> {
    try {
      // Check if base directory exists and is accessible
      await fs.promises.access(this.basePath, fs.constants.R_OK | fs.constants.W_OK);
      
      // Try to create a test file to verify write permissions
      const testFile = path.join(this.basePath, '.storage-check');
      const testContent = Buffer.from('storage-check');
      
      await fs.promises.writeFile(testFile, testContent);
      await fs.promises.unlink(testFile);
      
      return true;
    } catch (error) {
      console.error('[storage] Local storage check failed:', error);
      return false;
    }
  }
}
