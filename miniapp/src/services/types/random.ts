import type { MealPlanSlotKey } from '@/services/types/meal-plan'

export type RandomPickMode = 'single' | 'week'
export type RandomPickStatus = 'running' | 'completed' | 'abandoned'
export type RandomPickDecision = 'accepted' | 'skipped' | 'pending'

export interface RandomPickFiltersPayload {
  categoryIds?: string[]
  tagIds?: string[]
  maxDifficulty?: number
  excludeRecentDays?: number
  excludeCurrentWeekPlanned?: boolean
  preferredMemberTags?: string[]
}

export interface RandomPickSessionCreatePayload {
  mode: RandomPickMode
  weekStartDate?: string
  filters?: RandomPickFiltersPayload
}

export interface RandomPickResultAcceptPayload {
  plannedDate?: string
  mealSlot?: MealPlanSlotKey
  recipeVersionId?: string
  note?: string | null
}

export interface RandomPickFilterSnapshotDTO {
  weekStartDate: string | null
  categoryIds: string[]
  tagIds: string[]
  maxDifficulty: number | null
  excludeRecentDays: number | null
  excludeCurrentWeekPlanned: boolean
  preferredMemberTags: string[]
}

export interface RandomPickRecipeVersionOptionDTO {
  id: string
  versionNumber: number
  versionName: string | null
}

export interface RandomPickCategoryDTO {
  id: string
  name: string
  color: string | null
}

export interface RandomPickTagDTO {
  id: string
  name: string
  sortOrder: number
}

export interface RandomPickRecipeDTO {
  id: string
  name: string
  coverImageUrl: string | null
}

export interface RandomPickRecipeVersionDTO {
  id: string
  versionNumber: number
  versionName: string | null
  category: RandomPickCategoryDTO | null
  tags: RandomPickTagDTO[]
  difficultyRating: number
}

export interface RandomPickResultDTO {
  id: string
  sequenceNo: number
  pickedForDate: string | null
  decision: RandomPickDecision
  reasonMeta: Record<string, unknown> | null
  recipe: RandomPickRecipeDTO
  recipeVersion: RandomPickRecipeVersionDTO
  availableVersions: RandomPickRecipeVersionOptionDTO[]
  createdAt: string
}

export interface RandomPickSessionSummaryDTO {
  id: string
  mode: RandomPickMode
  status: RandomPickStatus
  weekStartDate: string | null
  filterSnapshot: RandomPickFilterSnapshotDTO
  resultCount: number
  createdAt: string
}

export interface RandomPickSessionDetailDTO {
  session: RandomPickSessionSummaryDTO
  results: RandomPickResultDTO[]
}

export interface RandomPickSessionCreateResultDTO {
  sessionId: string
  mode: RandomPickMode
  status: RandomPickStatus
  weekStartDate: string | null
  filterSnapshot: RandomPickFilterSnapshotDTO
  results: RandomPickResultDTO[]
}

export interface RandomPickRedrawResultDTO {
  sessionId: string
  result: RandomPickResultDTO
}

export interface RandomPickResultAcceptResultDTO {
  accepted: true
  mealPlanItemId: string
}

export interface RandomPickResultSkipResultDTO {
  skipped: true
}
