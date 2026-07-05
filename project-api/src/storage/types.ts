// File storage adapter interface
export interface FileStorageAdapter {
  download(path: string): Promise<Buffer>;
  upload(path: string, file: Buffer | Blob): Promise<void>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getDownloadUrl(path: string, expiresInSeconds?: number): Promise<string>;
  getPublicUrl(path: string): string;
  getBasePath(): string;
  check(): Promise<boolean>;
}
