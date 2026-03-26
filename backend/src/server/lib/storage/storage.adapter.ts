import { AppError, errorCodes } from "@/server/lib/errors";
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

class NoopStorageAdapter implements StorageAdapter {
  async createUploadToken(input: UploadTokenInput): Promise<UploadTokenResult> {
    void input;
    throw new AppError("对象存储适配层尚未接入具体实现", {
      code: errorCodes.INTERNAL_ERROR,
      statusCode: 501,
    });
  }

  async registerAsset(input: RegisterAssetInput) {
    return input;
  }

  getPublicUrl(assetKey: string): string {
    void assetKey;
    throw new AppError("对象存储适配层尚未接入具体实现", {
      code: errorCodes.INTERNAL_ERROR,
      statusCode: 501,
    });
  }
}

let storageAdapter: StorageAdapter = new NoopStorageAdapter();

export function getStorageAdapter() {
  return storageAdapter;
}

export function setStorageAdapter(adapter: StorageAdapter) {
  storageAdapter = adapter;
}
