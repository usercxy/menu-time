import type { PageResult, PaginationQuery } from './api'
import type { MediaAssetDTO } from './media'

export interface MomentRecipeVersionDTO {
  id: string
  versionNumber: number
  versionName?: string
}

export interface MomentItemDTO {
  id: string
  occurredOn: string
  content: string
  participantsText?: string
  tasteRating: number
  difficultyRating: number
  images: MediaAssetDTO[]
  recipeVersion?: MomentRecipeVersionDTO
}

export interface GetRecipeMomentsQuery extends PaginationQuery {}

export interface CreateMomentPayload {
  recipeVersionId: string
  occurredOn: string
  content: string
  participantsText?: string
  tasteRating: number
  difficultyRating: number
  isCoverCandidate?: boolean
  imageAssetIds: string[]
}

export interface UpdateMomentPayload {
  recipeVersionId?: string
  occurredOn?: string
  content?: string
  participantsText?: string
  tasteRating?: number
  difficultyRating?: number
  isCoverCandidate?: boolean
  imageAssetIds?: string[]
}

export interface LatestMomentItemDTO {
  momentId: string
  recipeId: string
  recipeName: string
  coverImageUrl?: string
  occurredOn: string
  previewText: string
}

export interface GetLatestMomentsQuery {
  limit?: number
}

export type RecipeMomentListResultDTO = PageResult<MomentItemDTO>
export type LatestMomentListResultDTO = {
  items: LatestMomentItemDTO[]
}
