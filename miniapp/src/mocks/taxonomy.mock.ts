import type {
  CategoryDTO,
  CategoryMutationPayload,
  TagDTO,
  TagMutationPayload
} from '@/services/types/taxonomy'

const CATEGORY_COLOR_FALLBACK = '#a84533'

export const mockCategories: CategoryDTO[] = [
  { id: 'cat_all', name: '全部菜谱', sortOrder: 0, color: '#a84533' },
  { id: 'cat_meat', name: '肉菜', sortOrder: 1, color: '#b45a45' },
  { id: 'cat_veg', name: '素菜', sortOrder: 2, color: '#596859' },
  { id: 'cat_soup', name: '汤羹', sortOrder: 3, color: '#6e6353' }
]

export const mockTags: TagDTO[] = [
  { id: 'tag_family', name: '家传味道', sortOrder: 0 },
  { id: 'tag_quick', name: '快手菜', sortOrder: 1 },
  { id: 'tag_feast', name: '节庆菜单', sortOrder: 2 }
]

function normalizeSortOrder<TItem extends { sortOrder: number }>(items: TItem[]) {
  items.forEach((item, index) => {
    item.sortOrder = index
  })
}

function buildTaxonomyId(prefix: 'cat' | 'tag') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function getMockCategories() {
  return [...mockCategories]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({ ...item }))
}

export function createMockCategory(payload: CategoryMutationPayload) {
  const nextCategory: CategoryDTO = {
    id: buildTaxonomyId('cat'),
    name: payload.name.trim(),
    color: payload.color?.trim() || CATEGORY_COLOR_FALLBACK,
    sortOrder: mockCategories.length
  }

  mockCategories.push(nextCategory)
  normalizeSortOrder(mockCategories)

  return { ...nextCategory }
}

export function updateMockCategory(categoryId: string, payload: CategoryMutationPayload) {
  const target = mockCategories.find((item) => item.id === categoryId)

  if (!target) {
    throw new Error('CATEGORY_NOT_FOUND')
  }

  target.name = payload.name.trim()
  target.color = payload.color?.trim() || CATEGORY_COLOR_FALLBACK
  normalizeSortOrder(mockCategories)

  return { ...target }
}

export function getMockTags() {
  return [...mockTags]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({ ...item }))
}

export function createMockTag(payload: TagMutationPayload) {
  const nextTag: TagDTO = {
    id: buildTaxonomyId('tag'),
    name: payload.name.trim(),
    sortOrder: mockTags.length
  }

  mockTags.push(nextTag)
  normalizeSortOrder(mockTags)

  return { ...nextTag }
}

export function updateMockTag(tagId: string, payload: TagMutationPayload) {
  const target = mockTags.find((item) => item.id === tagId)

  if (!target) {
    throw new Error('TAG_NOT_FOUND')
  }

  target.name = payload.name.trim()
  normalizeSortOrder(mockTags)

  return { ...target }
}
