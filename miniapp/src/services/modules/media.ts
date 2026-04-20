import { request } from '@/services/request/client'
import type {
  CreateUploadTokenPayload,
  MediaAssetDTO,
  RegisterMediaAssetPayload,
  UploadTokenDTO
} from '@/services/types/media'

export const mediaService = {
  async createUploadToken(payload: CreateUploadTokenPayload) {
    const response = await request<UploadTokenDTO>({
      url: '/api/v1/media/upload-token',
      method: 'POST',
      data: payload
    })

    return response.data
  },
  async registerAsset(payload: RegisterMediaAssetPayload) {
    const response = await request<MediaAssetDTO>({
      url: '/api/v1/media/assets',
      method: 'POST',
      data: payload
    })

    return response.data
  }
}
