import dayjs from 'dayjs'
import type {
  CreateMealPlanItemPayload,
  MealPlanMutationResultDTO,
  MealPlanWeekRawDTO,
  ReorderMealPlanItemsPayload,
  UpdateMealPlanItemPayload
} from '@/services/types/meal-plan'

const mealPlanWeekStore = new Map<string, MealPlanWeekRawDTO>()

function createSeedWeek(): MealPlanWeekRawDTO {
  return {
    id: 'week_2026_04_20',
    weekStartDate: '2026-04-20',
    status: 'draft',
    plannedItemCount: 3,
    items: [
      {
        id: 'meal_1',
        plannedDate: '2026-04-22',
        mealSlot: 'lunch',
        sortOrder: 0,
        sourceType: 'manual',
        note: '适合清爽解腻',
        recipe: {
          id: 'recipe_salad',
          name: '雨后田野沙拉',
          coverImageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
          status: 'active',
          isDeleted: false
        },
        recipeVersion: {
          id: 'version_salad_2',
          versionNumber: 2,
          versionName: '清爽版'
        },
        createdAt: '2026-04-20T09:00:00.000Z',
        updatedAt: '2026-04-20T09:00:00.000Z'
      },
      {
        id: 'meal_2',
        plannedDate: '2026-04-22',
        mealSlot: 'dinner',
        sortOrder: 0,
        sourceType: 'manual',
        note: '今晚家人都在，值得慢炖',
        recipe: {
          id: 'recipe_braised_pork',
          name: '外婆的红烧肉',
          coverImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
          status: 'active',
          isDeleted: false
        },
        recipeVersion: {
          id: 'version_3',
          versionNumber: 3,
          versionName: '大姨的秘方'
        },
        createdAt: '2026-04-20T09:10:00.000Z',
        updatedAt: '2026-04-20T09:10:00.000Z'
      },
      {
        id: 'meal_3',
        plannedDate: '2026-04-24',
        mealSlot: 'dinner',
        sortOrder: 0,
        sourceType: 'manual',
        note: '阴天适合热汤',
        recipe: {
          id: 'recipe_mushroom_soup',
          name: '奶油蘑菇汤',
          coverImageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
          status: 'active',
          isDeleted: false
        },
        recipeVersion: {
          id: 'version_soup_1',
          versionNumber: 1,
          versionName: '基础版'
        },
        createdAt: '2026-04-20T09:20:00.000Z',
        updatedAt: '2026-04-20T09:20:00.000Z'
      }
    ]
  }
}

mealPlanWeekStore.set('2026-04-20', createSeedWeek())

function cloneWeek(week: MealPlanWeekRawDTO) {
  return JSON.parse(JSON.stringify(week)) as MealPlanWeekRawDTO
}

function compactBucketSortOrders(week: MealPlanWeekRawDTO, plannedDate: string, mealSlot: MealPlanWeekRawDTO['items'][number]['mealSlot']) {
  week.items
    .filter((item) => item.plannedDate === plannedDate && item.mealSlot === mealSlot)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((item, index) => {
      item.sortOrder = index
    })
}

function ensureWeek(weekStartDate: string) {
  const existing = mealPlanWeekStore.get(weekStartDate)
  if (existing) {
    return existing
  }

  const nextWeek: MealPlanWeekRawDTO = {
    id: `week_${weekStartDate.replace(/-/g, '_')}`,
    weekStartDate,
    status: 'draft',
    plannedItemCount: 0,
    items: []
  }

  mealPlanWeekStore.set(weekStartDate, nextWeek)
  return nextWeek
}

function syncWeekCount(week: MealPlanWeekRawDTO) {
  week.plannedItemCount = week.items.length
}

function findItemById(id: string) {
  for (const week of mealPlanWeekStore.values()) {
    const item = week.items.find((entry) => entry.id === id)
    if (item) {
      return { week, item }
    }
  }

  return null
}

export function getMockCurrentWeekPlan() {
  const weekStartDate = dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
  return cloneWeek(ensureWeek(weekStartDate))
}

export function getMockWeekPlan(weekStartDate: string) {
  return cloneWeek(ensureWeek(weekStartDate))
}

export function createMockMealPlanItem(weekStartDate: string, payload: CreateMealPlanItemPayload): MealPlanMutationResultDTO {
  const week = ensureWeek(weekStartDate)
  const id = `meal_${Date.now()}`
  const sortOrder = week.items.filter((item) => item.plannedDate === payload.plannedDate && item.mealSlot === payload.mealSlot).length

  week.items.push({
    id,
    plannedDate: payload.plannedDate,
    mealSlot: payload.mealSlot,
    sortOrder,
    sourceType: payload.sourceType || 'manual',
    note: payload.note || null,
    recipe: {
      id: payload.recipeId,
      name: payload.recipeId === 'recipe_braised_pork' ? '外婆的红烧肉' : payload.recipeId === 'recipe_mushroom_soup' ? '奶油蘑菇汤' : '雨后田野沙拉',
      coverImageUrl:
        payload.recipeId === 'recipe_braised_pork'
          ? 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
          : payload.recipeId === 'recipe_mushroom_soup'
            ? 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80'
            : 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
      status: 'active',
      isDeleted: false
    },
    recipeVersion: {
      id: payload.recipeVersionId,
      versionNumber: 1,
      versionName: '已选版本'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  syncWeekCount(week)

  return { id }
}

export function updateMockMealPlanItem(id: string, payload: UpdateMealPlanItemPayload): MealPlanMutationResultDTO {
  const result = findItemById(id)
  if (!result) {
    return { id }
  }

  const { week, item } = result
  const oldDate = item.plannedDate
  const oldSlot = item.mealSlot
  item.recipeVersion.id = payload.recipeVersionId || item.recipeVersion.id
  item.plannedDate = payload.plannedDate || item.plannedDate
  item.mealSlot = payload.mealSlot || item.mealSlot
  item.note = payload.note === undefined ? item.note : payload.note
  item.updatedAt = new Date().toISOString()

  compactBucketSortOrders(week, oldDate, oldSlot)
  compactBucketSortOrders(week, item.plannedDate, item.mealSlot)

  return { id }
}

export function deleteMockMealPlanItem(id: string) {
  const result = findItemById(id)
  if (!result) {
    return { deleted: true as const }
  }

  const { week, item } = result
  week.items = week.items.filter((entry) => entry.id !== id)
  compactBucketSortOrders(week, item.plannedDate, item.mealSlot)
  syncWeekCount(week)

  return { deleted: true as const }
}

export function reorderMockMealPlanItems(weekStartDate: string, payload: ReorderMealPlanItemsPayload) {
  const week = ensureWeek(weekStartDate)
  payload.items
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((target, index) => {
      const item = week.items.find((entry) => entry.id === target.id)
      if (item) {
        item.sortOrder = index
        item.updatedAt = new Date().toISOString()
      }
    })

  compactBucketSortOrders(week, payload.plannedDate, payload.mealSlot)
  return cloneWeek(week)
}
