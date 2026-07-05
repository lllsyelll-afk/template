// Supabase storage adapter
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { FileStorageAdapter } from "./types";

export interface SupabaseStorageConfig {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

export class SupabaseFileStorage implements FileStorageAdapter {
  private client: SupabaseClient;
  private bucket: string;

  constructor(config: SupabaseStorageConfig) {
    this.client = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.bucket = config.bucket;
  }

  async download(filePath: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    if (!data) {
      throw new Error("File not found");
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async upload(filePath: string, file: Buffer | Blob): Promise<void> {
    // Convert Blob to File for Supabase if needed
    let body: Buffer | File;
    if (file instanceof Blob) {
      body = new File([file], getBasename(filePath), {
        type: "application/octet-stream",
      });
    } else {
      body = file;
    }

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(filePath, body, {
        upsert: true,
        contentType: "application/octet-stream",
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async delete(filePath: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const folderPath = filePath.split("/").slice(0, -1).join("/") || ".";
    const fileName = filePath.split("/").pop() || "";

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(folderPath, {
        search: fileName,
      });

    if (error) {
      return false;
    }

    return (
      data?.some((item: { name: string }) => item.name === fileName) ?? false
    );
  }

  async getDownloadUrl(
    filePath: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error("Failed to create signed URL");
    }

    return data.signedUrl;
  }

  getPublicUrl(filePath: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  getBasePath(): string {
    return this.bucket;
  }

  async check(): Promise<boolean> {
    try {
      // Try to list bucket contents to verify connection and permissions
      const { error } = await this.client.storage
        .from(this.bucket)
        .list(".", { limit: 1 });

      if (error) {
        console.error('[storage] Supabase storage check failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[storage] Supabase storage check failed:', error);
      return false;
    }
  }
}

// Helper for path operations in browser/node compatible way
function getBasename(p: string): string {
  return p.split(/[/\\]/).pop() || "";
}
