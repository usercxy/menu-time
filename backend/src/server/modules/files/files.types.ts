import type { FilePurpose, ReadAssetDisposition } from "@/server/lib/storage/storage.types";

export type FileUploadPurpose = FilePurpose;

export type FileUploadTokenPayload = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type FileAssetRegistrationPayload = {
  assetKey: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

export type FileReadPayload = {
  id: string;
  disposition: ReadAssetDisposition;
  fileName?: string;
};

export type FileUploadTokenResultDto = {
  uploadUrl: string;
  headers?: Record<string, string>;
  assetKey: string;
  expiresInSeconds: number;
  maxSizeBytes: number;
};

export type FileAssetDto = {
  id: string;
  assetKey: string;
  assetUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  purpose: FileUploadPurpose;
  createdAt: string;
};

export type FileReadUrlDto = {
  url: string;
  expiresInSeconds: number;
};
