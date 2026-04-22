import type { MediaAssetDTO } from '@/services/types/media'
import type {
  CreateMomentPayload,
  GetLatestMomentsQuery,
  GetRecipeMomentsQuery,
  LatestMomentItemDTO,
  MomentItemDTO,
  RecipeMomentListResultDTO,
  UpdateMomentPayload
} from '@/services/types/moment'
import { getMockRecipeRecord, getMockRecipeVersion, updateMockRecipeMomentState } from './recipe.mock'

interface MockMomentRecord {
  id: string
  recipeId: string
  recipeVersionId: string
  occurredOn: string
  content: string
  participantsText?: string
  tasteRating: number
  difficultyRating: number
  imageAssetIds: string[]
  isCoverCandidate?: boolean
  createdAt: string
  updatedAt: string
}

const mediaAssetStore = new Map<string, MediaAssetDTO>()
const uploadTokenStore = new Map<
  string,
  {
    fileName: string
    contentType: string
    sizeBytes: number
  }
>()

function seedAsset(asset: MediaAssetDTO) {
  mediaAssetStore.set(asset.id, asset)
  return asset.id
}

const recipeBraisedPorkMomentImage = seedAsset({
  id: 'asset_braised_pork_1',
  assetKey: 'mock/moments/braised-pork-1.jpg',
  assetUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  mimeType: 'image/jpeg',
  sizeBytes: 345678,
  width: 1280,
  height: 960,
  purpose: 'image',
  createdAt: '2026-03-20T18:20:00.000Z'
})

const recipeSoupMomentImage = seedAsset({
  id: 'asset_soup_1',
  assetKey: 'mock/moments/soup-1.jpg',
  assetUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
  mimeType: 'image/jpeg',
  sizeBytes: 278912,
  width: 1280,
  height: 960,
  purpose: 'image',
  createdAt: '2026-03-24T10:40:00.000Z'
})

const recipeSaladMomentImage = seedAsset({
  id: 'asset_salad_1',
  assetKey: 'mock/moments/salad-1.jpg',
  assetUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
  mimeType: 'image/jpeg',
  sizeBytes: 256123,
  width: 1280,
  height: 960,
  purpose: 'image',
  createdAt: '2026-03-18T12:10:00.000Z'
})

const momentStore: MockMomentRecord[] = [
  {
    id: 'moment_braised_pork_recent',
    recipeId: 'recipe_braised_pork',
    recipeVersionId: 'version_3',
    occurredOn: '2026-03-20',
    content: '这次火候刚刚好，肥肉入口即化，家里人抢着拌饭。',
    participantsText: '外婆、妈妈、我',
    tasteRating: 5,
    difficultyRating: 3,
    imageAssetIds: [recipeBraisedPorkMomentImage],
    isCoverCandidate: true,
    createdAt: '2026-03-20T18:20:00.000Z',
    updatedAt: '2026-03-20T18:30:00.000Z'
  },
  {
    id: 'moment_braised_pork_old',
    recipeId: 'recipe_braised_pork',
    recipeVersionId: 'version_2',
    occurredOn: '2026-03-10',
    content: '少糖版第一次上桌，长辈说更耐吃，下次可以再加一点姜片。',
    participantsText: '爸妈',
    tasteRating: 4,
    difficultyRating: 3,
    imageAssetIds: [],
    isCoverCandidate: false,
    createdAt: '2026-03-10T19:00:00.000Z',
    updatedAt: '2026-03-10T19:00:00.000Z'
  },
  {
    id: 'moment_soup_recent',
    recipeId: 'recipe_mushroom_soup',
    recipeVersionId: 'version_soup_1',
    occurredOn: '2026-03-24',
    content: '阴天配一锅奶油蘑菇汤，口感顺得像云一样。',
    participantsText: '两个人的晚餐',
    tasteRating: 5,
    difficultyRating: 2,
    imageAssetIds: [recipeSoupMomentImage],
    isCoverCandidate: true,
    createdAt: '2026-03-24T10:40:00.000Z',
    updatedAt: '2026-03-24T11:00:00.000Z'
  },
  {
    id: 'moment_salad_recent',
    recipeId: 'recipe_salad',
    recipeVersionId: 'version_salad_2',
    occurredOn: '2026-03-18',
    content: '加了更多番茄后果然更清爽，带去聚餐很快就空盘了。',
    participantsText: '朋友聚会',
    tasteRating: 4,
    difficultyRating: 1,
    imageAssetIds: [recipeSaladMomentImage],
    isCoverCandidate: true,
    createdAt: '2026-03-18T12:10:00.000Z',
    updatedAt: '2026-03-18T12:30:00.000Z'
  }
]

function sortMoments(a: MockMomentRecord, b: MockMomentRecord) {
  const occurredDiff = new Date(b.occurredOn).getTime() - new Date(a.occurredOn).getTime()
  if (occurredDiff !== 0) {
    return occurredDiff
  }

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

function getMomentImages(assetIds: string[]) {
  return assetIds
    .map((assetId) => mediaAssetStore.get(assetId))
    .filter((asset): asset is MediaAssetDTO => Boolean(asset))
}

function buildMomentItem(record: MockMomentRecord): MomentItemDTO {
  const recipeVersion = getMockRecipeVersion(record.recipeId, record.recipeVersionId)

  return {
    id: record.id,
    occurredOn: record.occurredOn,
    content: record.content,
    participantsText: record.participantsText,
    tasteRating: record.tasteRating,
    difficultyRating: record.difficultyRating,
    images: getMomentImages(record.imageAssetIds),
    recipeVersion: recipeVersion
      ? {
          id: recipeVersion.id,
          versionNumber: recipeVersion.versionNumber,
          versionName: recipeVersion.versionName
        }
      : undefined
  }
}

function syncRecipeMomentState(recipeId: string) {
  const moments = momentStore.filter((item) => item.recipeId === recipeId).sort(sortMoments)
  const latest = moments[0]
  const latestImages = latest ? getMomentImages(latest.imageAssetIds) : []

  updateMockRecipeMomentState(recipeId, {
    momentCount: moments.length,
    latestCookedAt: latest?.occurredOn || null,
    latestMomentAt: latest?.updatedAt || null,
    coverImageUrl: latest?.isCoverCandidate ? latestImages[0]?.assetUrl : undefined
  })
}

momentStore
  .map((item) => item.recipeId)
  .filter((recipeId, index, source) => source.indexOf(recipeId) === index)
  .forEach(syncRecipeMomentState)

function validateMomentPayload(payload: { imageAssetIds?: string[]; tasteRating?: number; difficultyRating?: number }) {
  if ((payload.imageAssetIds?.length || 0) > 9) {
    throw new Error('最多上传 9 张图片')
  }

  if (payload.tasteRating && (payload.tasteRating < 1 || payload.tasteRating > 5)) {
    throw new Error('风味评分需在 1 到 5 分之间')
  }

  if (payload.difficultyRating && (payload.difficultyRating < 1 || payload.difficultyRating > 5)) {
    throw new Error('难度评分需在 1 到 5 分之间')
  }
}

export function getMockRecipeMoments(
  recipeId: string,
  query: GetRecipeMomentsQuery = {}
): RecipeMomentListResultDTO {
  const allItems = momentStore.filter((item) => item.recipeId === recipeId).sort(sortMoments).map(buildMomentItem)
  const page = Math.max(query.page || 1, 1)
  const pageSize = Math.max(query.pageSize || 10, 1)
  const startIndex = (page - 1) * pageSize
  const items = allItems.slice(startIndex, startIndex + pageSize)

  return {
    items,
    page,
    pageSize,
    total: allItems.length,
    hasMore: startIndex + items.length < allItems.length
  }
}

export function createMockMoment(recipeId: string, payload: CreateMomentPayload) {
  validateMomentPayload(payload)

  const timestamp = new Date().toISOString()
  const id = `moment_${Date.now()}`
  const record: MockMomentRecord = {
    id,
    recipeId,
    recipeVersionId: payload.recipeVersionId,
    occurredOn: payload.occurredOn,
    content: payload.content.trim(),
    participantsText: payload.participantsText?.trim() || undefined,
    tasteRating: payload.tasteRating,
    difficultyRating: payload.difficultyRating,
    imageAssetIds: payload.imageAssetIds,
    isCoverCandidate: payload.isCoverCandidate,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  momentStore.unshift(record)
  syncRecipeMomentState(recipeId)

  return buildMomentItem(record)
}

export function updateMockMoment(momentId: string, payload: UpdateMomentPayload) {
  validateMomentPayload(payload)

  const record = momentStore.find((item) => item.id === momentId)
  if (!record) {
    return buildMomentItem(momentStore[0])
  }

  record.recipeVersionId = payload.recipeVersionId || record.recipeVersionId
  record.occurredOn = payload.occurredOn || record.occurredOn
  record.content = payload.content?.trim() || record.content
  record.participantsText = payload.participantsText?.trim() || undefined
  record.tasteRating = payload.tasteRating || record.tasteRating
  record.difficultyRating = payload.difficultyRating || record.difficultyRating
  record.imageAssetIds = payload.imageAssetIds || record.imageAssetIds
  record.isCoverCandidate = payload.isCoverCandidate ?? record.isCoverCandidate
  record.updatedAt = new Date().toISOString()

  syncRecipeMomentState(record.recipeId)

  return buildMomentItem(record)
}

export function deleteMockMoment(momentId: string) {
  const index = momentStore.findIndex((item) => item.id === momentId)
  if (index < 0) {
    return { success: true as const }
  }

  const [record] = momentStore.splice(index, 1)
  syncRecipeMomentState(record.recipeId)

  return { success: true as const }
}

export function getMockLatestMoments(query: GetLatestMomentsQuery = {}) {
  const limit = Math.max(query.limit || 6, 1)
  const items = momentStore
    .slice()
    .sort(sortMoments)
    .slice(0, limit)
    .map<LatestMomentItemDTO>((record) => {
      const recipe = getMockRecipeRecord(record.recipeId)
      const images = getMomentImages(record.imageAssetIds)

      return {
        momentId: record.id,
        recipeId: record.recipeId,
        recipeName: recipe?.name || '未命名菜谱',
        coverImageUrl: images[0]?.assetUrl || recipe?.coverImageUrl,
        occurredOn: record.occurredOn,
        previewText: record.content
      }
    })

  return { items }
}

export function createMockUploadToken(payload: { fileName: string; contentType: string; sizeBytes: number }) {
  const assetKey = `mock/uploads/${Date.now()}-${payload.fileName}`
  uploadTokenStore.set(assetKey, payload)

  return {
    uploadUrl: `mock://upload/${encodeURIComponent(assetKey)}`,
    headers: {
      'Content-Type': payload.contentType
    },
    assetKey,
    expiresInSeconds: 600,
    maxSizeBytes: 50 * 1024 * 1024
  }
}

export function createMockMediaAsset(payload: {
  assetKey: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
}) {
  const uploadToken = uploadTokenStore.get(payload.assetKey)
  const timestamp = new Date().toISOString()
  const fileName = uploadToken?.fileName || payload.assetKey.split('/').pop() || 'moment-image.jpg'
  const id = `asset_${Date.now()}`
  const asset: MediaAssetDTO = {
    id,
    assetKey: payload.assetKey,
    assetUrl: `https://placehold.co/1200x900/f5f2e6/2c4c3b?text=${encodeURIComponent(fileName)}`,
    mimeType: payload.mimeType,
    sizeBytes: payload.sizeBytes,
    width: payload.width || null,
    height: payload.height || null,
    purpose: 'image',
    createdAt: timestamp
  }

  mediaAssetStore.set(asset.id, asset)

  return asset
}
