export type MediaPurpose = "moment" | "cover" | "share";

export type UploadTokenInput = {
  householdId: string;
  purpose: MediaPurpose;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type UploadTokenResult = {
  uploadUrl: string;
  headers?: Record<string, string>;
  assetKey: string;
  expiresInSeconds?: number;
};

export type RegisterAssetInput = {
  householdId: string;
  assetKey: string;
  assetUrl: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  purpose: MediaPurpose;
  createdBy: string;
};
