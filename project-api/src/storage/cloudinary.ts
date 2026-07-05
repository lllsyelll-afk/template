// Cloudinary storage adapter
import { v2 as cloudinary } from "cloudinary";
import type { FileStorageAdapter } from "./types";

export interface CloudinaryStorageConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string; // Optional folder name in Cloudinary
}

export class CloudinaryFileStorage implements FileStorageAdapter {
  private folder: string;

  constructor(config: CloudinaryStorageConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    });
    this.folder = config.folder || "uploads";
  }

  private getPublicId(filePath: string): string {
    // Remove leading slashes and convert to Cloudinary public_id format
    const cleanPath = filePath.replace(/^\/+/, "");
    return this.folder ? `${this.folder}/${cleanPath}` : cleanPath;
  }


  async download(filePath: string): Promise<Buffer> {
    const publicId = this.getPublicId(filePath);

    return new Promise((resolve, reject) => {
      cloudinary.api.resource(publicId, (error, result) => {
        if (error) {
          reject(new Error(`Failed to download file: ${error.message}`));
          return;
        }

        if (!result || !result.secure_url) {
          reject(new Error("File not found"));
          return;
        }

        // Download the image from the secure URL
        fetch(result.secure_url)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.arrayBuffer();
          })
          .then((arrayBuffer) => Buffer.from(arrayBuffer))
          .then((buffer) => resolve(buffer))
          .catch((fetchError) =>
            reject(new Error(`Failed to fetch file: ${fetchError.message}`)),
          );
      });
    });
  }

  async upload(filePath: string, file: Buffer | Blob): Promise<void> {
    const publicId = this.getPublicId(filePath);

    let buffer: Buffer;
    if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            folder: this.folder,
            resource_type: "auto", // Let Cloudinary auto-detect resource type
            overwrite: true,
          },
          (error, result) => {
            if (error) {
              reject(new Error(`Failed to upload file: ${error.message}`));
              return;
            }
            if (!result) {
              reject(new Error("Upload failed: No result returned"));
              return;
            }
            resolve();
          },
        )
        .end(buffer);
    });
  }

  async delete(filePath: string): Promise<void> {
    const publicId = this.getPublicId(filePath);

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error) => {
        if (error) {
          reject(new Error(`Failed to delete file: ${error.message}`));
          return;
        }
        // Cloudinary returns result even if file doesn't exist, so we treat it as success
        resolve();
      });
    });
  }

  async exists(filePath: string): Promise<boolean> {
    const publicId = this.getPublicId(filePath);

    return new Promise((resolve) => {
      cloudinary.api.resource(publicId, (error, result) => {
        // If there's an error or no result, file doesn't exist
        resolve(!error && !!result);
      });
    });
  }

  async getDownloadUrl(
    filePath: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const publicId = this.getPublicId(filePath);
    const exists = await this.exists(filePath);

    if (!exists) {
      throw new Error("File not found");
    }

    // Generate a signed URL for the resource
    const url = cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    });

    if (!url) {
      throw new Error("Failed to generate signed URL");
    }
    return url;
  }

  getPublicUrl(filePath: string): string {
    const publicId = this.getPublicId(filePath);
    return cloudinary.url(publicId, { secure: true });
  }

  getBasePath(): string {
    return this.folder;
  }

  async check(): Promise<boolean> {
    try {
      // Try to ping Cloudinary API to verify connection and credentials
      return new Promise((resolve) => {
        cloudinary.api.ping((error, result) => {
          if (error) {
            console.error('[storage] Cloudinary storage check failed:', error);
            resolve(false);
          } else {
            resolve(!!result?.status && result.status === 'ok');
          }
        });
      });
    } catch (error) {
      console.error('[storage] Cloudinary storage check failed:', error);
      return false;
    }
  }
}
