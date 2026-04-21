export interface CreateUploadTokenPayload {
  fileName: string
  contentType: string
  sizeBytes: number
}

export interface UploadTokenDTO {
  uploadUrl: string
  headers?: Record<string, string>
  assetKey: string
  expiresInSeconds: number
  maxSizeBytes: number
}

export interface RegisterMediaAssetPayload {
  assetKey: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
}

export interface MediaAssetDTO {
  id: string
  assetKey: string
  assetUrl: string
  mimeType: string
  sizeBytes: number
  width?: number | null
  height?: number | null
  purpose: 'image'
  createdAt: string
}
