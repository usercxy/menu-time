import type { PageResult } from '@/services/types/api'
import type {
  CompareVersionsDTO,
  CreateRecipePayload,
  CreateRecipeResultDTO,
  CreateVersionPayload,
  CreateVersionResultDTO,
  GetRecipesQuery,
  IngredientLineDTO,
  RecipeCategoryDTO,
  RecipeDetailDTO,
  RecipeListItemDTO,
  RecipeStepDTO,
  RecipeTagDTO,
  UpdateRecipePayload,
  VersionDiffSummaryDTO,
  RecipeVersionDetailDTO,
  RecipeVersionListItemDTO
} from '@/services/types/recipe'
import { mockCategories, mockTags } from './taxonomy.mock'

const DEFAULT_COVER_URL =
  'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80'

interface MockRecipeRecord {
  id: string
  name: string
  story: string
  coverImageUrl?: string
  momentCount: number
  latestCookedAt?: string
  currentVersionId: string
  versions: RecipeVersionDetailDTO[]
}

function createVersion(
  input: Omit<RecipeVersionDetailDTO, 'ingredients' | 'steps'> & {
    ingredients: string[]
    steps: string[]
  }
): RecipeVersionDetailDTO {
  return {
    ...input,
    ingredients: input.ingredients.map((rawText) => normalizeIngredient(rawText)),
    steps: input.steps.map((content, index) => ({
      sortOrder: index + 1,
      content
    }))
  }
}

const recipeStore: MockRecipeRecord[] = [
  {
    id: 'recipe_braised_pork',
    name: '外婆的红烧肉',
    story: '把时间炖到发亮，把一家人的惦念慢慢收进锅里。',
    coverImageUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    momentCount: 12,
    latestCookedAt: '2026-03-20',
    currentVersionId: 'version_3',
    versions: [
      createVersion({
        id: 'version_1',
        versionNumber: 1,
        versionName: '老灶台原版',
        category: { id: 'cat_meat', name: '肉菜' },
        tags: [{ id: 'tag_family', name: '家传味道' }],
        createdAt: '2026-03-01T10:00:00.000Z',
        ingredients: ['五花肉 600g', '冰糖 20g', '老抽 1 勺'],
        steps: ['肉先焯水去杂味。', '慢慢炒糖色，再把五花肉裹上颜色。', '加水小火焖透。'],
        tips: '第一版偏传统，口味厚重。'
      }),
      createVersion({
        id: 'version_2',
        versionNumber: 2,
        versionName: '少糖版',
        sourceVersionId: 'version_1',
        diffSummaryText: '减少了冰糖用量，整体口味更清爽。',
        category: { id: 'cat_meat', name: '肉菜' },
        tags: [{ id: 'tag_family', name: '家传味道' }],
        createdAt: '2026-03-10T10:00:00.000Z',
        ingredients: ['五花肉 550g', '冰糖 12g', '老抽 1 勺'],
        steps: ['肉先焯水。', '缩短炒糖色时间，让颜色更轻。', '小火焖到软糯即可。'],
        tips: '更适合平日吃。'
      }),
      createVersion({
        id: 'version_3',
        versionNumber: 3,
        versionName: '大姨的秘方',
        sourceVersionId: 'version_2',
        diffSummaryText: '主料分量微调，步骤更适合家庭厨房复刻。',
        category: { id: 'cat_meat', name: '肉菜' },
        tags: [{ id: 'tag_family', name: '家传味道' }],
        createdAt: '2026-03-20T10:00:00.000Z',
        ingredients: ['五花肉 500g', '冰糖 30g', '老抽 2 勺'],
        steps: [
          '冷水下锅焯肉，轻轻撇净浮沫。',
          '小火煸出油脂，再炒糖色，让肉均匀裹上焦糖光泽。',
          '加热水没过食材，焖煮到酱汁浓亮。'
        ],
        tips: '炒糖色一定要守在锅边，颜色转枣红就立刻下肉。'
      })
    ]
  },
  {
    id: 'recipe_mushroom_soup',
    name: '奶油蘑菇汤',
    story: '周中忙完之后，用一锅顺滑的汤给自己留一点轻松时刻。',
    coverImageUrl:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    momentCount: 4,
    latestCookedAt: '2026-03-24',
    currentVersionId: 'version_soup_1',
    versions: [
      createVersion({
        id: 'version_soup_1',
        versionNumber: 1,
        versionName: '基础版',
        category: { id: 'cat_soup', name: '汤羹' },
        tags: [{ id: 'tag_quick', name: '快手菜' }],
        createdAt: '2026-03-24T10:00:00.000Z',
        ingredients: ['口蘑 8 朵', '淡奶油 120ml', '洋葱 半个'],
        steps: [
          '黄油炒香洋葱和蘑菇，煸到边缘微焦。',
          '加入清水煮沸，再用料理机打成细腻浓汤。',
          '回锅后倒入淡奶油，小火收至顺滑。'
        ],
        tips: '黑胡椒最后撒，香气会更干净。'
      })
    ]
  },
  {
    id: 'recipe_salad',
    name: '雨后田野沙拉',
    story: '想吃轻一点的时候，就把冰箱里新鲜的颜色都装进碗里。',
    coverImageUrl:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
    momentCount: 9,
    latestCookedAt: '2026-03-18',
    currentVersionId: 'version_salad_2',
    versions: [
      createVersion({
        id: 'version_salad_1',
        versionNumber: 1,
        versionName: '原味版',
        category: { id: 'cat_veg', name: '素菜' },
        tags: [{ id: 'tag_feast', name: '节庆菜单' }],
        createdAt: '2026-03-15T10:00:00.000Z',
        ingredients: ['生菜 1 颗', '圣女果 8 颗', '油醋汁 1 勺'],
        steps: ['蔬菜洗净沥干。', '酱汁分开装，食用前再拌。'],
        tips: '适合偏清淡口味。'
      }),
      createVersion({
        id: 'version_salad_2',
        versionNumber: 2,
        versionName: '清爽版',
        sourceVersionId: 'version_salad_1',
        diffSummaryText: '增加了番茄比例，口感更清新。',
        category: { id: 'cat_veg', name: '素菜' },
        tags: [{ id: 'tag_feast', name: '节庆菜单' }],
        createdAt: '2026-03-18T10:00:00.000Z',
        ingredients: ['生菜 1 颗', '圣女果 10 颗', '油醋汁 2 勺'],
        steps: ['蔬菜洗净沥干，尽量保持清脆口感。', '食用前再拌入酱汁，避免出水。'],
        tips: '可以临出门前再撒坚果碎，口感更好。'
      })
    ]
  }
]

function normalizeIngredient(rawText: string): IngredientLineDTO {
  const trimmed = rawText.trim()
  return {
    rawText: trimmed,
    normalizedName: trimmed.split(/\s+/)[0] || trimmed
  }
}

function normalizeSteps(steps: RecipeStepDTO[]) {
  return steps
    .map((step) => step.content.trim())
    .filter(Boolean)
    .map((content, index) => ({
      sortOrder: index + 1,
      content
    }))
}

function findRecipe(recipeId: string) {
  return recipeStore.find((item) => item.id === recipeId)
}

function getCurrentVersion(recipe: MockRecipeRecord) {
  return recipe.versions.find((version) => version.id === recipe.currentVersionId) || recipe.versions[0]
}

function resolveCategory(payload: {
  categoryId?: string | null
  newCategoryName?: string | null
}): RecipeCategoryDTO | undefined {
  const customName = payload.newCategoryName?.trim()
  if (customName) {
    return {
      id: `cat_custom_${Date.now()}`,
      name: customName
    }
  }

  if (!payload.categoryId) {
    return undefined
  }

  const found = mockCategories.find((item) => item.id === payload.categoryId)
  return found
    ? {
        id: found.id,
        name: found.name
      }
    : undefined
}

function resolveTags(payload: { tagIds: string[]; newTagNames?: string[] }): RecipeTagDTO[] {
  const selectedTags = payload.tagIds
    .map((tagId) => mockTags.find((item) => item.id === tagId))
    .filter((tag): tag is (typeof mockTags)[number] => Boolean(tag))
    .map((tag) => ({
      id: tag.id,
      name: tag.name
    }))

  const customTags = (payload.newTagNames || [])
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `tag_custom_${Date.now()}_${index}`,
      name
    }))

  return [...selectedTags, ...customTags]
}

function buildRecipeListItem(recipe: MockRecipeRecord): RecipeListItemDTO {
  const currentVersion = getCurrentVersion(recipe)
  return {
    id: recipe.id,
    name: recipe.name,
    coverImageUrl: recipe.coverImageUrl,
    currentVersion: {
      id: currentVersion.id,
      versionNumber: currentVersion.versionNumber,
      versionName: currentVersion.versionName,
      category: currentVersion.category,
      tags: currentVersion.tags
    },
    versionCount: recipe.versions.length,
    momentCount: recipe.momentCount,
    latestCookedAt: recipe.latestCookedAt
  }
}

function buildRecipeDetail(recipe: MockRecipeRecord): RecipeDetailDTO {
  const currentVersion = getCurrentVersion(recipe)
  return {
    id: recipe.id,
    name: recipe.name,
    story: recipe.story,
    coverImageUrl: recipe.coverImageUrl,
    versionCount: recipe.versions.length,
    momentCount: recipe.momentCount,
    currentVersion,
    ingredients: currentVersion.ingredients,
    steps: currentVersion.steps,
    tips: currentVersion.tips
  }
}

function buildVersionDiffSummaryData(
  sourceVersion: RecipeVersionDetailDTO,
  nextVersion: RecipeVersionDetailDTO
): VersionDiffSummaryDTO {
  const addedTagNames = nextVersion.tags
    .filter((tag) => !sourceVersion.tags.some((sourceTag) => sourceTag.id === tag.id))
    .map((tag) => tag.name)
  const removedTagNames = sourceVersion.tags
    .filter((tag) => !nextVersion.tags.some((nextTag) => nextTag.id === tag.id))
    .map((tag) => tag.name)
  const ingredientsChanged =
    sourceVersion.ingredients.map((item) => item.rawText).join('|') !==
    nextVersion.ingredients.map((item) => item.rawText).join('|')
  const stepDelta = nextVersion.steps.length - sourceVersion.steps.length

  const summaryParts = [
    ingredientsChanged ? '主料有调整' : '保留原有主料结构',
    addedTagNames.length ? `新增标签：${addedTagNames.join('、')}` : '',
    removedTagNames.length ? `移除标签：${removedTagNames.join('、')}` : '',
    stepDelta ? `步骤数 ${stepDelta > 0 ? '增加' : '减少'} ${Math.abs(stepDelta)} 条` : '步骤数保持不变'
  ].filter(Boolean)

  return {
    ingredientsChanged,
    addedTags: addedTagNames,
    removedTags: removedTagNames,
    stepCountBefore: sourceVersion.steps.length,
    stepCountAfter: nextVersion.steps.length,
    summary: summaryParts.join('；')
  }
}

function buildVersionDiffSummary(sourceVersion: RecipeVersionDetailDTO, nextVersion: RecipeVersionDetailDTO) {
  return buildVersionDiffSummaryData(sourceVersion, nextVersion).summary || ''
}

export function getMockRecipeList(query: GetRecipesQuery = {}): PageResult<RecipeListItemDTO> {
  const keyword = query.keyword?.trim().toLowerCase()
  const filteredItems = recipeStore
    .map(buildRecipeListItem)
    .filter((recipe) => {
      const matchesKeyword = keyword ? recipe.name.toLowerCase().includes(keyword) : true
      const matchesCategory = query.categoryId ? recipe.currentVersion.category?.id === query.categoryId : true
      const matchesTag = query.tagId
        ? recipe.currentVersion.tags.some((tag) => tag.id === query.tagId)
        : true
      return matchesKeyword && matchesCategory && matchesTag
    })
  const page = Math.max(query.page || 1, 1)
  const pageSize = Math.max(query.pageSize || filteredItems.length || 20, 1)
  const startIndex = (page - 1) * pageSize
  const items = filteredItems.slice(startIndex, startIndex + pageSize)

  return {
    items,
    page,
    pageSize,
    total: filteredItems.length,
    hasMore: startIndex + items.length < filteredItems.length
  }
}

export function getMockRecipeDetail(id: string) {
  const recipe = findRecipe(id) || recipeStore[0]
  return buildRecipeDetail(recipe)
}

export function getMockRecipeVersions(recipeId: string): RecipeVersionListItemDTO[] {
  const recipe = findRecipe(recipeId) || recipeStore[0]
  return [...recipe.versions]
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      versionName: version.versionName,
      isCurrent: version.id === recipe.currentVersionId,
      diffSummaryText: version.diffSummaryText,
      createdAt: version.createdAt || new Date().toISOString()
    }))
}

export function getMockRecipeVersionDetail(recipeId: string, versionId: string) {
  const recipe = findRecipe(recipeId) || recipeStore[0]
  return recipe.versions.find((version) => version.id === versionId) || getCurrentVersion(recipe)
}

export function getMockRecipeCompare(
  recipeId: string,
  baseVersionId: string,
  targetVersionId: string
): CompareVersionsDTO {
  const recipe = findRecipe(recipeId) || recipeStore[0]
  const baseVersion =
    recipe.versions.find((version) => version.id === baseVersionId) || recipe.versions[0]
  const targetVersion =
    recipe.versions.find((version) => version.id === targetVersionId) || getCurrentVersion(recipe)
  const summaryJson = buildVersionDiffSummaryData(baseVersion, targetVersion)

  return {
    baseVersion: {
      id: baseVersion.id,
      versionNumber: baseVersion.versionNumber,
      versionName: baseVersion.versionName
    },
    targetVersion: {
      id: targetVersion.id,
      versionNumber: targetVersion.versionNumber,
      versionName: targetVersion.versionName
    },
    summaryText: summaryJson.summary || '',
    summaryJson
  }
}

export function createMockRecipe(payload: CreateRecipePayload): CreateRecipeResultDTO {
  const timestamp = Date.now()
  const recipeId = `recipe_${timestamp}`
  const currentVersionId = `version_${timestamp}`
  const category = resolveCategory(payload)
  const tags = resolveTags(payload)

  const currentVersion: RecipeVersionDetailDTO = {
    id: currentVersionId,
    versionNumber: 1,
    versionName: payload.versionName?.trim() || 'V1 初稿',
    category,
    tags,
    createdAt: new Date(timestamp).toISOString(),
    ingredients: payload.ingredients
      .map((item) => item.rawText.trim())
      .filter(Boolean)
      .map((rawText) => normalizeIngredient(rawText)),
    steps: normalizeSteps(payload.steps),
    tips: payload.tips?.trim() || undefined
  }

  recipeStore.unshift({
    id: recipeId,
    name: payload.name.trim(),
    story: `第一次把「${payload.name.trim()}」认真记下来，留给下一次更从容地复刻。`,
    coverImageUrl: DEFAULT_COVER_URL,
    momentCount: 0,
    currentVersionId,
    versions: [currentVersion]
  })

  return {
    recipeId,
    currentVersionId,
    versionNumber: 1
  }
}

export function updateMockRecipe(recipeId: string, payload: UpdateRecipePayload) {
  const recipe = findRecipe(recipeId)

  if (!recipe) {
    return { success: true as const }
  }

  if (payload.name?.trim()) {
    recipe.name = payload.name.trim()
    recipe.story = `把「${recipe.name}」的基础档案重新整理了一遍，方便后面继续打磨版本和记录食光。`
  }

  return { success: true as const }
}

export function createMockRecipeVersion(
  recipeId: string,
  payload: CreateVersionPayload
): CreateVersionResultDTO {
  const recipe = findRecipe(recipeId)
  if (!recipe) {
    return {
      versionId: 'missing',
      versionNumber: 1,
      diffSummaryText: '未找到来源菜谱'
    }
  }

  const sourceVersion =
    recipe.versions.find((version) => version.id === payload.sourceVersionId) || getCurrentVersion(recipe)
  const timestamp = Date.now()
  const versionId = `version_${timestamp}`
  const nextVersion: RecipeVersionDetailDTO = {
    id: versionId,
    versionNumber: recipe.versions.length + 1,
    versionName: payload.versionName?.trim() || `V${recipe.versions.length + 1} 调整版`,
    sourceVersionId: sourceVersion.id,
    category: resolveCategory(payload) || sourceVersion.category,
    tags: resolveTags(payload),
    createdAt: new Date(timestamp).toISOString(),
    ingredients: payload.ingredients
      .map((item) => item.rawText.trim())
      .filter(Boolean)
      .map((rawText) => normalizeIngredient(rawText)),
    steps: normalizeSteps(payload.steps),
    tips: payload.tips?.trim() || undefined
  }

  nextVersion.diffSummaryText = buildVersionDiffSummary(sourceVersion, nextVersion)

  recipe.versions.push(nextVersion)
  recipe.currentVersionId = nextVersion.id
  recipe.latestCookedAt = new Date(timestamp).toISOString().slice(0, 10)

  return {
    versionId: nextVersion.id,
    versionNumber: nextVersion.versionNumber,
    diffSummaryText: nextVersion.diffSummaryText
  }
}

export function setMockCurrentRecipeVersion(recipeId: string, versionId: string) {
  const recipe = findRecipe(recipeId)
  if (!recipe || !recipe.versions.some((version) => version.id === versionId)) {
    return { success: true as const }
  }

  recipe.currentVersionId = versionId

  return { success: true as const }
}
