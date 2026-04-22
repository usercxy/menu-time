import Taro from '@tarojs/taro'
import { RequestError } from '@/services/request/client'
import { mediaService } from '@/services/modules/media'
import type { MediaAssetDTO } from '@/services/types/media'
import { getNetworkTransportErrorInfo } from '@/utils/network-error'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const DEFAULT_MAX_SIZE_BYTES = 50 * 1024 * 1024
const DEFAULT_UPLOAD_TIMEOUT_MS = 60_000
const MAX_MOMENT_IMAGE_COUNT = 9

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

function ensureFileName(filePath: string, mimeType: AllowedImageMimeType, prefix: string) {
  const existingFileName = filePath.split('/').pop()?.trim()
  if (existingFileName) {
    return existingFileName
  }

  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.replace('image/', '')
  return `${prefix}-${Date.now()}.${extension}`
}

function ensureLocalImage(
  mimeType: AllowedImageMimeType | null,
  sizeBytes: number,
  label: string
): asserts mimeType is AllowedImageMimeType {
  if (!mimeType) {
    throw new Error(`${label}仅支持 JPG、PNG、WEBP 格式`)
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

function normalizeUploadError(error: unknown, operation: string) {
  if (error instanceof RequestError) {
    return error
  }

  const transportError = getNetworkTransportErrorInfo(error, operation)
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

function isMockUploadUrl(url: string) {
  return url.startsWith('mock://')
}

function getUploadErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof RequestError) {
    const details = (error.details || {}) as { maxSizeBytes?: number }

    if (error.code === 'BUSINESS_RULE_VIOLATION' && details.maxSizeBytes) {
      return `图片不能超过 ${formatSizeLimit(details.maxSizeBytes)}，请压缩后重试`
    }

    return error.message || fallbackMessage
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

function normalizeAssetUrl(asset: MediaAssetDTO, draft: LocalImageDraft) {
  if (!asset.assetUrl || asset.assetUrl.includes('placehold.co')) {
    return {
      ...asset,
      assetUrl: draft.filePath
    }
  }

  return asset
}

async function createLocalImageDraft(file: Taro.chooseMedia.SuccessCallbackResult['tempFiles'][number], prefix: string) {
  const imageInfo = await Taro.getImageInfo({
    src: file.tempFilePath
  })
  const mimeType = inferMimeType(file.tempFilePath, imageInfo.type || file.fileType)

  ensureLocalImage(mimeType, file.size, '图片')

  return {
    filePath: file.tempFilePath,
    fileName: ensureFileName(file.tempFilePath, mimeType, prefix),
    mimeType,
    sizeBytes: file.size,
    width: imageInfo.width,
    height: imageInfo.height
  }
}

async function uploadImageDraft(draft: LocalImageDraft, operation: string) {
  const uploadToken = await mediaService.createUploadToken({
    fileName: draft.fileName,
    contentType: draft.mimeType,
    sizeBytes: draft.sizeBytes
  })

  if (!isMockUploadUrl(uploadToken.uploadUrl)) {
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
        timeout: DEFAULT_UPLOAD_TIMEOUT_MS
      })
    } catch (error) {
      throw normalizeUploadError(error, operation)
    }

    if (![200, 204].includes(uploadResponse.statusCode)) {
      throw new Error('图片上传到存储服务失败，请稍后重试')
    }
  }

  const asset = await mediaService.registerAsset({
    assetKey: uploadToken.assetKey,
    mimeType: draft.mimeType,
    sizeBytes: draft.sizeBytes,
    width: draft.width,
    height: draft.height
  })

  return normalizeAssetUrl(asset, draft)
}

export function getRecipeCoverUploadErrorMessage(error: unknown) {
  return getUploadErrorMessage(error, '封面上传失败，请稍后重试')
}

export function getMomentUploadErrorMessage(error: unknown) {
  return getUploadErrorMessage(error, '图片上传失败，请稍后重试')
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

  return createLocalImageDraft(file, 'recipe-cover')
}

export async function chooseMomentImageDrafts(existingCount: number): Promise<LocalImageDraft[]> {
  const remainingCount = Math.max(MAX_MOMENT_IMAGE_COUNT - existingCount, 0)

  if (!remainingCount) {
    throw new Error(`最多上传 ${MAX_MOMENT_IMAGE_COUNT} 张图片`)
  }

  const media = await Taro.chooseMedia({
    count: remainingCount,
    mediaType: ['image'],
    sizeType: ['compressed']
  })

  const drafts = await Promise.all(media.tempFiles.map((file) => createLocalImageDraft(file, 'moment-image')))

  if (existingCount + drafts.length > MAX_MOMENT_IMAGE_COUNT) {
    throw new Error(`最多上传 ${MAX_MOMENT_IMAGE_COUNT} 张图片`)
  }

  return drafts
}

export async function uploadRecipeCover(draft: LocalImageDraft): Promise<MediaAssetDTO> {
  return uploadImageDraft(draft, '封面上传')
}

export async function uploadMomentImages(drafts: LocalImageDraft[]): Promise<MediaAssetDTO[]> {
  const result: MediaAssetDTO[] = []

  for (const draft of drafts) {
    result.push(await uploadImageDraft(draft, '时光图片上传'))
  }

  return result
}
