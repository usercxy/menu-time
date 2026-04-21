export type FilePurpose = "image";

export type ReadAssetDisposition = "inline" | "attachment";

export type UploadTokenInput = {
  householdId: string;
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
  purpose: FilePurpose;
  createdBy: string;
};

export type ReadAssetUrlInput = {
  assetKey: string;
  mimeType: string;
  disposition: ReadAssetDisposition;
  fileName?: string;
};

export type ReadAssetUrlResult = {
  url: string;
  expiresInSeconds: number;
};
