// File storage factory - exports adapter instances
import * as path from "path";
import { LocalFileStorage, type LocalStorageConfig } from "./local";
import { SupabaseFileStorage, type SupabaseStorageConfig } from "./supabase";
import {
  CloudinaryFileStorage,
  type CloudinaryStorageConfig,
} from "./cloudinary";
import { S3FileStorage, type S3StorageConfig } from "./s3";
import type { FileStorageAdapter } from "./types";

export type {
  FileStorageAdapter,
  LocalStorageConfig,
  SupabaseStorageConfig,
  CloudinaryStorageConfig,
  S3StorageConfig,
};
export {
  LocalFileStorage,
  SupabaseFileStorage,
  CloudinaryFileStorage,
  S3FileStorage,
};

export interface StorageConfig {
  type: "local" | "supabase" | "cloudinary" | "s3";
  local?: LocalStorageConfig;
  supabase?: SupabaseStorageConfig;
  cloudinary?: CloudinaryStorageConfig;
  s3?: S3StorageConfig;
}

export function createFileStorage(config: StorageConfig): FileStorageAdapter {
  switch (config.type) {
    case "local": {
      if (!config.local?.basePath) {
        throw new Error("Local storage requires basePath");
      }
      return new LocalFileStorage(config.local);
    }
    case "supabase": {
      if (
        !config.supabase?.url ||
        !config.supabase?.serviceRoleKey ||
        !config.supabase?.bucket
      ) {
        throw new Error(
          "Supabase storage requires url, serviceRoleKey, and bucket",
        );
      }
      return new SupabaseFileStorage(config.supabase);
    }
    case "cloudinary": {
      if (
        !config.cloudinary?.cloudName ||
        !config.cloudinary?.apiKey ||
        !config.cloudinary?.apiSecret
      ) {
        throw new Error(
          "Cloudinary storage requires cloudName, apiKey, and apiSecret",
        );
      }
      return new CloudinaryFileStorage(config.cloudinary);
    }
    case "s3": {
      if (
        !config.s3?.region ||
        !config.s3?.accessKeyId ||
        !config.s3?.secretAccessKey ||
        !config.s3?.bucket
      ) {
        throw new Error(
          "S3 storage requires region, accessKeyId, secretAccessKey, and bucket",
        );
      }
      return new S3FileStorage(config.s3);
    }
    default:
      throw new Error(
        `Unknown storage type: ${(config as StorageConfig).type}`,
      );
  }
}

// Default singleton instance based on environment
let defaultStorage: FileStorageAdapter | null = null;

// Load project config for app port
function getAppBaseUrl(): string {
  const apiPort = process.env.API_PORT || 45231;
  return `http://localhost:${apiPort}`;
}

export function getDefaultStorage(): FileStorageAdapter {
  if (!defaultStorage) {
    const storageType = process.env.STORAGE_PROVIDER || "local";

    if (storageType === "supabase") {
      defaultStorage = createFileStorage({
        type: "supabase",
        supabase: {
          url: process.env.SUPABASE_URL!,
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          bucket: process.env.SUPABASE_STORAGE_BUCKET || "files",
        },
      });
    } else if (storageType === "cloudinary") {
      defaultStorage = createFileStorage({
        type: "cloudinary",
        cloudinary: {
          cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
          apiKey: process.env.CLOUDINARY_API_KEY!,
          apiSecret: process.env.CLOUDINARY_API_SECRET!,
          folder: process.env.CLOUDINARY_FOLDER || "uploads",
        },
      });
    } else if (storageType === "s3") {
      defaultStorage = createFileStorage({
        type: "s3",
        s3: {
          region: process.env.AWS_REGION!,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          bucket: process.env.AWS_S3_BUCKET!,
          endpoint: process.env.AWS_S3_ENDPOINT,
          forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === "true",
          cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
        },
      });
    } else {
      defaultStorage = createFileStorage({
        type: "local",
        local: {
          basePath:
            process.env.LOCAL_STORAGE_PATH ||
            path.resolve(process.cwd(), "uploads"),
          baseUrl: getAppBaseUrl(),
        },
      });
    }
  }
  return defaultStorage;
}

// Reset singleton (useful for testing)
export function resetDefaultStorage(): void {
  defaultStorage = null;
}
