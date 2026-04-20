import { createS3StorageAdapter } from "@/server/lib/storage/s3-storage.adapter";
import type {
  RegisterAssetInput,
  UploadTokenInput,
  UploadTokenResult,
} from "@/server/lib/storage/storage.types";

export interface StorageAdapter {
  createUploadToken(input: UploadTokenInput): Promise<UploadTokenResult>;
  registerAsset(input: RegisterAssetInput): Promise<RegisterAssetInput>;
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
