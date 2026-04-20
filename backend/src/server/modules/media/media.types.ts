import type { MediaPurpose } from "@/server/lib/storage/storage.types";

export type MediaUploadPurpose = Extract<MediaPurpose, "cover">;

export type MediaUploadTokenPayload = {
  purpose: MediaUploadPurpose;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type MediaAssetRegistrationPayload = {
  assetKey: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  purpose: MediaUploadPurpose;
};

export type MediaUploadTokenResultDto = {
  uploadUrl: string;
  headers?: Record<string, string>;
  assetKey: string;
  expiresInSeconds: number;
  maxSizeBytes: number;
};

export type MediaAssetDto = {
  id: string;
  assetKey: string;
  assetUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  purpose: MediaUploadPurpose;
  createdAt: string;
};
