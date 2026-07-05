// AWS S3 storage adapter
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { FileStorageAdapter } from "./types";

export interface S3StorageConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string; // Optional for custom S3-compatible endpoints
  forcePathStyle?: boolean; // Optional for custom S3-compatible endpoints
  cloudFrontDomain?: string; // Optional CloudFront domain for public URLs (e.g. cdn.example.com)
}

export class S3FileStorage implements FileStorageAdapter {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint?: string;
  private forcePathStyle?: boolean;
  private cloudFrontDomain?: string;

  constructor(config: S3StorageConfig) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
    });
    this.bucket = config.bucket;
    this.region = config.region;
    this.endpoint = config.endpoint;
    this.forcePathStyle = config.forcePathStyle;
    this.cloudFrontDomain = config.cloudFrontDomain;
  }

  private getKey(filePath: string): string {
    // Remove leading slashes and ensure consistent key format
    return filePath.replace(/^\/+/, "");
  }

  async download(filePath: string): Promise<Buffer> {
    const key = this.getKey(filePath);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error("File not found or empty");
      }

      // Convert stream to buffer
      if (response.Body instanceof ReadableStream) {
        const chunks: Uint8Array[] = [];
        const reader = response.Body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        return Buffer.concat(chunks);
      } else {
        // Handle case where Body is already a Buffer or other type
        return Buffer.from(await response.Body.transformToByteArray());
      }
    } catch (error) {
      const err = error as Error;
      if (err.name === "NoSuchKey") {
        throw new Error("File not found");
      }
      throw new Error(`Failed to download file: ${err.message}`);
    }
  }

  async upload(filePath: string, file: Buffer | Blob): Promise<void> {
    const key = this.getKey(filePath);

    let buffer: Buffer;
    if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
      });

      await this.client.send(command);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to upload file: ${err.message}`);
    }
  }

  async delete(filePath: string): Promise<void> {
    const key = this.getKey(filePath);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to delete file: ${err.message}`);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const key = this.getKey(filePath);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      const err = error as Error;
      if (err.name === "NotFound" || err.name === "NoSuchKey") {
        return false;
      }
      throw new Error(`Failed to check file existence: ${err.message}`);
    }
  }

  async getDownloadUrl(
    filePath: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const key = this.getKey(filePath);
    const exists = await this.exists(filePath);

    if (!exists) {
      throw new Error("File not found");
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.client, command, {
        expiresIn: expiresInSeconds,
      });

      return signedUrl;
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to generate signed URL: ${err.message}`);
    }
  }

  getPublicUrl(filePath: string): string {
    const key = this.getKey(filePath);

    if (this.cloudFrontDomain) {
      return `https://${this.cloudFrontDomain}/${key}`;
    }

    if (this.endpoint) {
      if (this.forcePathStyle) {
        return `${this.endpoint}/${this.bucket}/${key}`;
      }
      return `${this.endpoint}/${key}`;
    }

    if (this.forcePathStyle) {
      return `https://s3.${this.region}.amazonaws.com/${this.bucket}/${key}`;
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  getBasePath(): string {
    return this.bucket;
  }

  async check(): Promise<boolean> {
    try {
      // Try to list bucket contents to verify connection and permissions
      
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: 1, // Only check if we can access the bucket
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('[storage] S3 storage check failed:', error);
      return false;
    }
  }
}
