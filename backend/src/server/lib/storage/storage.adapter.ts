import { createS3StorageAdapter } from "@/server/lib/storage/s3-storage.adapter";
import type {
  ReadAssetUrlInput,
  ReadAssetUrlResult,
  RegisterAssetInput,
  UploadTokenInput,
  UploadTokenResult,
} from "@/server/lib/storage/storage.types";

export interface StorageAdapter {
  createUploadToken(input: UploadTokenInput): Promise<UploadTokenResult>;
  registerAsset(input: RegisterAssetInput): Promise<RegisterAssetInput>;
  createReadAssetUrl(input: ReadAssetUrlInput): Promise<ReadAssetUrlResult>;
  getPublicUrl(assetKey: string): string;
}

let storageAdapter: StorageAdapter | null = null;

export function getStorageAdapter() {
  if (!storageAdapter) {
    storageAdapter = createS3StorageAdapter();
  }

  return storageAdapter;
}

export function setStorageAdapter(adapter: StorageAdapter) {
  storageAdapter = adapter;
}
