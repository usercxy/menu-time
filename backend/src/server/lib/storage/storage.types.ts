export type UploadTokenInput = {
  householdId: string;
  purpose: "moment" | "cover" | "share";
  fileName: string;
  contentType: string;
};

export type UploadTokenResult = {
  uploadUrl: string;
  headers?: Record<string, string>;
  assetKey: string;
};

export type RegisterAssetInput = {
  householdId: string;
  assetKey: string;
  assetUrl: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  purpose: "moment" | "cover" | "share";
  createdBy: string;
};
