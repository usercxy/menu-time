import type {
  CreateRecipePayload,
  CreateRecipeResultDTO,
  RecipeCategoryDTO,
  RecipeDetailDTO,
  RecipeTagDTO,
  RecipeVersionDetailDTO,
  RecipeVersionListResultDTO
} from '@/services/types/recipe'

interface NamedOption {
  id: string
  name: string
}

function normalizeIngredient(rawText: string) {
  const trimmed = rawText.trim()

  return {
    rawText: trimmed,
    normalizedName: trimmed.split(/\s+/)[0] || trimmed
  }
}

function normalizeCategory(
  payload: Pick<CreateRecipePayload, 'categoryId' | 'newCategoryName'>,
  categories: NamedOption[] = []
): RecipeCategoryDTO | undefined {
  const customName = payload.newCategoryName?.trim()
  if (customName) {
    return {
      id: `temp_category_${Date.now()}`,
      name: customName
    }
  }

  if (!payload.categoryId) {
    return undefined
  }

  const matchedCategory = categories.find((item) => item.id === payload.categoryId)
  return matchedCategory
    ? {
        id: matchedCategory.id,
        name: matchedCategory.name
      }
    : undefined
}

function normalizeTags(
  payload: Pick<CreateRecipePayload, 'tagIds' | 'newTagNames'>,
  tags: NamedOption[] = []
): RecipeTagDTO[] {
  const selectedTags = payload.tagIds
    .map((tagId) => tags.find((item) => item.id === tagId))
    .filter((tag): tag is NamedOption => Boolean(tag))
    .map((tag) => ({
      id: tag.id,
      name: tag.name
    }))

  const customTags = (payload.newTagNames || [])
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `temp_tag_${Date.now()}_${index}`,
      name
    }))

  return [...selectedTags, ...customTags]
}

function buildCurrentVersion(
  payload: CreateRecipePayload,
  result: CreateRecipeResultDTO,
  categories: NamedOption[] = [],
  tags: NamedOption[] = []
): RecipeVersionDetailDTO {
  return {
    id: result.currentVersionId,
    versionNumber: result.versionNumber,
    versionName: payload.versionName?.trim() || 'V1 初稿',
    category: normalizeCategory(payload, categories),
    tags: normalizeTags(payload, tags),
    createdAt: new Date().toISOString(),
    ingredients: payload.ingredients
      .map((item) => item.rawText.trim())
      .filter(Boolean)
      .map((rawText) => normalizeIngredient(rawText)),
    steps: payload.steps
      .map((step) => step.content.trim())
      .filter(Boolean)
      .map((content, index) => ({
        sortOrder: index + 1,
        content
      })),
    tips: payload.tips?.trim() || undefined
  }
}

export function buildOptimisticRecipeDetail(
  payload: CreateRecipePayload,
  result: CreateRecipeResultDTO,
  categories: NamedOption[] = [],
  tags: NamedOption[] = []
): RecipeDetailDTO {
  return {
    id: result.recipeId,
    name: payload.name.trim(),
    slug: null,
    coverImageUrl: undefined,
    coverSource: 'none',
    versionCount: 1,
    momentCount: 0,
    latestCookedAt: null,
    latestMomentAt: null,
    status: 'active',
    currentVersion: buildCurrentVersion(payload, result, categories, tags)
  }
}

export function buildOptimisticRecipeVersions(
  payload: CreateRecipePayload,
  result: CreateRecipeResultDTO,
  categories: NamedOption[] = [],
  tags: NamedOption[] = []
): RecipeVersionListResultDTO {
  const currentVersion = buildCurrentVersion(payload, result, categories, tags)

  return {
    items: [
      {
        id: currentVersion.id,
        versionNumber: currentVersion.versionNumber,
        versionName: currentVersion.versionName,
        isCurrent: true,
        diffSummaryText: currentVersion.diffSummaryText,
        createdAt: currentVersion.createdAt || new Date().toISOString()
      }
    ],
    page: 1,
    pageSize: 20,
    total: 1,
    hasMore: false
  }
}
