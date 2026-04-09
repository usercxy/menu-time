import type { NamedRefDTO, PageResult, PaginationQuery } from './api'

export interface RecipeTagDTO extends NamedRefDTO {}

export interface RecipeCategoryDTO extends NamedRefDTO {}

export interface IngredientLineDTO {
  rawText: string
  normalizedName?: string
  amountText?: string
  unit?: string
  isSeasoning?: boolean
}

export interface RecipeStepDTO {
  sortOrder: number
  content: string
}

export interface RecipeVersionBriefDTO {
  id: string
  versionNumber: number
  versionName?: string
  category?: RecipeCategoryDTO
  tags: RecipeTagDTO[]
}

export interface RecipeVersionDetailDTO extends RecipeVersionBriefDTO {
  sourceVersionId?: string
  diffSummaryText?: string
  createdAt?: string
  ingredients: IngredientLineDTO[]
  steps: RecipeStepDTO[]
  tips?: string
}

export interface RecipeVersionListItemDTO {
  id: string
  versionNumber: number
  versionName?: string
  isCurrent: boolean
  diffSummaryText?: string
  createdAt: string
}

export interface RecipeListItemDTO {
  id: string
  name: string
  coverImageUrl?: string
  currentVersion: RecipeVersionBriefDTO | null
  versionCount: number
  momentCount: number
  latestMomentAt?: string
  latestCookedAt?: string
}

export interface GetRecipesQuery extends PaginationQuery {
  keyword?: string
  categoryId?: string
  tagIds?: string[]
}

export interface CreateRecipePayload {
  name: string
  categoryId?: string | null
  newCategoryName?: string | null
  tagIds: string[]
  newTagNames?: string[]
  versionName?: string
  ingredients: IngredientLineDTO[]
  steps: RecipeStepDTO[]
  tips?: string
}

export interface CreateRecipeResultDTO {
  recipeId: string
  currentVersionId: string
  versionNumber: number
}

export interface UpdateRecipePayload {
  name?: string
  coverImageId?: string
  status?: 'active' | 'archived'
}

export interface CreateVersionPayload {
  sourceVersionId: string
  versionName?: string
  categoryId?: string | null
  newCategoryName?: string | null
  tagIds: string[]
  newTagNames?: string[]
  ingredients: IngredientLineDTO[]
  steps: RecipeStepDTO[]
  tips?: string
}

export interface CreateVersionResultDTO {
  versionId: string
  versionNumber: number
  diffSummaryText?: string
}

export interface VersionDiffSummaryDTO {
  ingredientsChanged?: boolean
  addedTags?: string[]
  removedTags?: string[]
  stepCountBefore?: number
  stepCountAfter?: number
  summary?: string
}

export interface CompareVersionsDTO {
  baseVersion: {
    id?: string
    versionNumber: number
    versionName?: string
  }
  targetVersion: {
    id?: string
    versionNumber: number
    versionName?: string
  }
  summaryText: string
  summaryJson?: VersionDiffSummaryDTO
}

export interface RecipeDetailDTO {
  id: string
  name: string
  slug?: string | null
  coverImageUrl?: string
  coverSource?: string
  versionCount: number
  momentCount: number
  latestMomentAt?: string | null
  latestCookedAt?: string | null
  status?: 'active' | 'archived' | string
  currentVersion: RecipeVersionDetailDTO | null
}

export type RecipeListResultDTO = PageResult<RecipeListItemDTO>
export type RecipeVersionListResultDTO = PageResult<RecipeVersionListItemDTO>
