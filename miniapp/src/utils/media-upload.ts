import Taro from '@tarojs/taro'
import { RequestError } from '@/services/request/client'
import { mediaService } from '@/services/modules/media'
import type { MediaAssetDTO } from '@/services/types/media'
import { getNetworkTransportErrorInfo } from '@/utils/network-error'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const DEFAULT_MAX_SIZE_BYTES = 50 * 1024 * 1024
const COVER_UPLOAD_TIMEOUT_MS = 60_000

type AllowedImageMimeType = (typeof ALLOWED_IMAGE_TYPES)[number]

export interface LocalImageDraft {
  filePath: string
  fileName: string
  mimeType: AllowedImageMimeType
  sizeBytes: number
  width: number
  height: number
}

function buildMimeType(extensionOrType?: string | null): AllowedImageMimeType | null {
  const normalized = extensionOrType?.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  if (normalized === 'jpg' || normalized === 'jpeg' || normalized === 'image/jpeg') {
    return 'image/jpeg'
  }

  if (normalized === 'png' || normalized === 'image/png') {
    return 'image/png'
  }

  if (normalized === 'webp' || normalized === 'image/webp') {
    return 'image/webp'
  }

  return null
}

function inferMimeType(filePath: string, typeHint?: string | null) {
  const directMatch = buildMimeType(typeHint)
  if (directMatch) {
    return directMatch
  }

  const extension = filePath.split('.').pop()
  return buildMimeType(extension)
}

function ensureFileName(filePath: string, mimeType: AllowedImageMimeType) {
  const existingFileName = filePath.split('/').pop()?.trim()
  if (existingFileName) {
    return existingFileName
  }

  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.replace('image/', '')
  return `recipe-cover-${Date.now()}.${extension}`
}

function ensureLocalImage(
  mimeType: AllowedImageMimeType | null,
  sizeBytes: number
): asserts mimeType is AllowedImageMimeType {
  if (!mimeType) {
    throw new Error('封面仅支持 JPG、PNG、WEBP 格式')
  }

  if (sizeBytes > DEFAULT_MAX_SIZE_BYTES) {
    throw new Error('图片不能超过 50MB，请压缩后重试')
  }
}

function readLocalFileAsArrayBuffer(filePath: string) {
  const fs = Taro.getFileSystemManager()
  const result = fs.readFileSync(filePath)

  if (typeof result === 'string') {
    throw new Error('图片读取失败，请重新选择后再试')
  }

  return result
}

function formatSizeLimit(sizeBytes: number) {
  const sizeInMb = sizeBytes / (1024 * 1024)
  return Number.isInteger(sizeInMb) ? `${sizeInMb}MB` : `${sizeInMb.toFixed(1)}MB`
}

function normalizeCoverUploadError(error: unknown) {
  if (error instanceof RequestError) {
    return error
  }

  const transportError = getNetworkTransportErrorInfo(error, '封面上传')
  if (transportError) {
    return new RequestError({
      code: transportError.code,
      message: transportError.message,
      requestId: '',
      statusCode: 0,
      details: {
        rawMessage: transportError.rawMessage
      }
    })
  }

  return error
}

export function getRecipeCoverUploadErrorMessage(error: unknown) {
  if (error instanceof RequestError) {
    const details = (error.details || {}) as { maxSizeBytes?: number }

    if (error.code === 'BUSINESS_RULE_VIOLATION' && details.maxSizeBytes) {
      return `图片不能超过 ${formatSizeLimit(details.maxSizeBytes)}，请压缩后重试`
    }

    return error.message || '封面上传失败，请稍后重试'
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return '封面上传失败，请稍后重试'
}

export async function chooseRecipeCoverDraft(): Promise<LocalImageDraft | null> {
  const media = await Taro.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sizeType: ['compressed']
  })
  const file = media.tempFiles[0]

  if (!file) {
    return null
  }

  const imageInfo = await Taro.getImageInfo({
    src: file.tempFilePath
  })
  const mimeType = inferMimeType(file.tempFilePath, imageInfo.type || file.fileType)

  ensureLocalImage(mimeType, file.size)

  return {
    filePath: file.tempFilePath,
    fileName: ensureFileName(file.tempFilePath, mimeType),
    mimeType,
    sizeBytes: file.size,
    width: imageInfo.width,
    height: imageInfo.height
  }
}

export async function uploadRecipeCover(draft: LocalImageDraft): Promise<MediaAssetDTO> {
  const uploadToken = await mediaService.createUploadToken({
    fileName: draft.fileName,
    contentType: draft.mimeType,
    sizeBytes: draft.sizeBytes
  })
  const uploadHeaders = {
    ...uploadToken.headers,
    'Content-Type': uploadToken.headers?.['Content-Type'] || uploadToken.headers?.['content-type'] || draft.mimeType
  }

  let uploadResponse: Taro.request.SuccessCallbackResult<Record<string, unknown>>

  try {
    uploadResponse = await Taro.request({
      url: uploadToken.uploadUrl,
      method: 'PUT',
      data: readLocalFileAsArrayBuffer(draft.filePath),
      header: uploadHeaders,
      timeout: COVER_UPLOAD_TIMEOUT_MS
    })
  } catch (error) {
    throw normalizeCoverUploadError(error)
  }

  if (![200, 204].includes(uploadResponse.statusCode)) {
    throw new Error('图片上传到存储服务失败，请稍后重试')
  }

  return mediaService.registerAsset({
    assetKey: uploadToken.assetKey,
    mimeType: draft.mimeType,
    sizeBytes: draft.sizeBytes,
    width: draft.width,
    height: draft.height
  })
}
