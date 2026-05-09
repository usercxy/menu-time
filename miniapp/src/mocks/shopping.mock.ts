import { getMockWeekPlan } from '@/mocks/meal-plan.mock'
import type { MealPlanItemDTO } from '@/services/types/meal-plan'
import type {
  ShoppingListCopyTextResultDTO,
  ShoppingListDetailDTO,
  ShoppingListGeneratePayload,
  ShoppingListGenerateResultDTO,
  ShoppingListItemDTO,
  ShoppingListItemType,
  ShoppingListItemUpdatePayload,
  ShoppingListShareImageResultDTO
} from '@/services/types/shopping'

type IngredientSeed = {
  itemType: ShoppingListItemType
  displayName: string
  normalizedName: string
  quantityNote: string | null
}

const shoppingListStore = new Map<string, ShoppingListDetailDTO>()
let shoppingListSequence = 1
let shoppingItemSequence = 1

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getRecipeIngredientSeeds(item: MealPlanItemDTO): IngredientSeed[] {
  const recipeName = item.recipe.name

  if (recipeName.includes('红烧肉')) {
    return [
      { itemType: 'ingredient', displayName: '五花肉', normalizedName: '五花肉', quantityNote: '约 500g' },
      { itemType: 'ingredient', displayName: '生姜', normalizedName: '生姜', quantityNote: '几片' },
      { itemType: 'seasoning', displayName: '冰糖', normalizedName: '冰糖', quantityNote: '一小把' },
      { itemType: 'seasoning', displayName: '生抽', normalizedName: '生抽', quantityNote: '适量' }
    ]
  }

  if (recipeName.includes('蘑菇汤')) {
    return [
      { itemType: 'ingredient', displayName: '蘑菇', normalizedName: '蘑菇', quantityNote: '约 300g' },
      { itemType: 'ingredient', displayName: '洋葱', normalizedName: '洋葱', quantityNote: '半颗' },
      { itemType: 'seasoning', displayName: '黑胡椒', normalizedName: '黑胡椒', quantityNote: '少许' },
      { itemType: 'seasoning', displayName: '淡奶油', normalizedName: '淡奶油', quantityNote: '一小盒' }
    ]
  }

  if (recipeName.includes('沙拉')) {
    return [
      { itemType: 'ingredient', displayName: '生菜', normalizedName: '生菜', quantityNote: '一把' },
      { itemType: 'ingredient', displayName: '小番茄', normalizedName: '小番茄', quantityNote: '一盒' },
      { itemType: 'seasoning', displayName: '橄榄油', normalizedName: '橄榄油', quantityNote: '适量' },
      { itemType: 'seasoning', displayName: '海盐', normalizedName: '海盐', quantityNote: '少许' }
    ]
  }

  return [
    { itemType: 'ingredient', displayName: recipeName, normalizedName: recipeName, quantityNote: '按一餐准备' },
    { itemType: 'seasoning', displayName: '盐', normalizedName: '盐', quantityNote: '适量' }
  ]
}

function buildSourceRef(item: MealPlanItemDTO): ShoppingListItemDTO['sourceRecipeRefs'][number] {
  return {
    mealPlanItemId: item.id,
    plannedDate: item.plannedDate,
    mealSlot: item.mealSlot,
    recipeId: item.recipe.id,
    recipeName: item.recipe.name,
    recipeVersionId: item.recipeVersion.id,
    versionNumber: item.recipeVersion.versionNumber,
    versionName: item.recipeVersion.versionName
  }
}

function getLatestActiveListByWeek(weekStartDate: string) {
  return Array.from(shoppingListStore.values())
    .filter((list) => list.weekStartDate === weekStartDate && list.status === 'active')
    .sort((left, right) => right.versionNo - left.versionNo)[0]
}

function syncShoppingListCounts(list: ShoppingListDetailDTO) {
  list.totalItemCount = list.ingredientItems.length + list.seasoningItems.length
  list.checkedItemCount = [...list.ingredientItems, ...list.seasoningItems].filter((item) => item.isChecked).length
}

export function generateMockShoppingList(payload: ShoppingListGeneratePayload): ShoppingListGenerateResultDTO {
  const week = getMockWeekPlan(payload.weekStartDate)

  if (!week.items.length) {
    throw new Error('当前周菜单为空，先添加菜谱后再生成购物清单。')
  }

  const archivedListIds: string[] = []
  const previousActive = getLatestActiveListByWeek(payload.weekStartDate)
  if (previousActive) {
    previousActive.status = 'archived'
    archivedListIds.push(previousActive.id)
  }

  const previousItemsByKey = new Map(
    previousActive
      ? [...previousActive.ingredientItems, ...previousActive.seasoningItems].map((item) => [
          `${item.itemType}:${item.normalizedName}`,
          item
        ])
      : []
  )
  const aggregate = new Map<string, IngredientSeed & { sourceRecipeRefs: ShoppingListItemDTO['sourceRecipeRefs'] }>()

  week.items.forEach((mealItem) => {
    getRecipeIngredientSeeds(mealItem).forEach((seed) => {
      const key = `${seed.itemType}:${seed.normalizedName}`
      const existing = aggregate.get(key)
      if (existing) {
        existing.sourceRecipeRefs.push(buildSourceRef(mealItem))
        return
      }

      aggregate.set(key, {
        ...seed,
        sourceRecipeRefs: [buildSourceRef(mealItem)]
      })
    })
  })

  const now = new Date().toISOString()
  const versionNo = Math.max(
    0,
    ...Array.from(shoppingListStore.values())
      .filter((list) => list.weekStartDate === payload.weekStartDate)
      .map((list) => list.versionNo)
  ) + 1
  const id = `shopping_${shoppingListSequence++}`
  const items = Array.from(aggregate.values()).map<ShoppingListItemDTO>((entry, index) => {
    const previous = previousItemsByKey.get(`${entry.itemType}:${entry.normalizedName}`)

    return {
      id: `shopping_item_${shoppingItemSequence++}`,
      itemType: entry.itemType,
      displayName: entry.displayName,
      normalizedName: entry.normalizedName,
      quantityNote: previous?.quantityNote ?? entry.quantityNote,
      sourceCount: entry.sourceRecipeRefs.length,
      isChecked: previous?.isChecked ?? false,
      sortOrder: index,
      sourceRecipeRefs: entry.sourceRecipeRefs,
      createdAt: now,
      updatedAt: now
    }
  })

  const list: ShoppingListDetailDTO = {
    id,
    weekStartDate: payload.weekStartDate,
    generatedFrom: payload.generatedFrom || 'manual',
    status: 'active',
    versionNo,
    generatedAt: now,
    menuLastUpdatedAt: week.items.reduce<string | null>(
      (latest, item) => (!latest || item.updatedAt > latest ? item.updatedAt : latest),
      null
    ),
    menuChangedAfterGenerated: false,
    totalItemCount: 0,
    checkedItemCount: 0,
    ingredientItems: items.filter((item) => item.itemType === 'ingredient'),
    seasoningItems: items.filter((item) => item.itemType === 'seasoning')
  }
  syncShoppingListCounts(list)
  shoppingListStore.set(id, list)

  return {
    shoppingListId: id,
    versionNo,
    archivedListIds
  }
}

export function getMockShoppingListDetail(id: string) {
  const list = shoppingListStore.get(id)
  if (!list) {
    throw new Error('购物清单不存在，请从点菜台重新生成。')
  }

  return clone(list)
}

export function updateMockShoppingListItem(id: string, payload: ShoppingListItemUpdatePayload) {
  for (const list of shoppingListStore.values()) {
    const item = [...list.ingredientItems, ...list.seasoningItems].find((entry) => entry.id === id)
    if (!item) {
      continue
    }

    if (payload.isChecked !== undefined) {
      item.isChecked = payload.isChecked
    }

    if (payload.quantityNote !== undefined) {
      item.quantityNote = payload.quantityNote?.trim() || null
    }

    item.updatedAt = new Date().toISOString()
    syncShoppingListCounts(list)
    return clone(item)
  }

  throw new Error('清单项不存在，请刷新后重试。')
}

export function createMockShoppingListCopyText(id: string): ShoppingListCopyTextResultDTO {
  const list = getMockShoppingListDetail(id)
  const renderItems = (title: string, items: ShoppingListItemDTO[]) => [
    `${title}`,
    ...items.map((item) => `${item.isChecked ? '✓' : '□'} ${item.displayName}${item.quantityNote ? `（${item.quantityNote}）` : ''}`)
  ]

  return {
    text: [
      `食光记购物清单 · ${list.weekStartDate} · V${list.versionNo}`,
      ...renderItems('原料', list.ingredientItems),
      ...renderItems('调料', list.seasoningItems)
    ].join('\n')
  }
}

export function createMockShoppingListShareImage(id: string): ShoppingListShareImageResultDTO {
  const list = getMockShoppingListDetail(id)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960"><rect width="720" height="960" fill="#fffdf2"/><text x="56" y="96" fill="#2c4c3b" font-size="42" font-family="serif" font-weight="700">食光记购物清单</text><text x="56" y="150" fill="#6b705c" font-size="26">第 ${list.versionNo} 版 · ${list.checkedItemCount}/${list.totalItemCount} 已购</text><text x="56" y="230" fill="#1a1c19" font-size="30">原料 ${list.ingredientItems.length} 项 · 调料 ${list.seasoningItems.length} 项</text><text x="56" y="300" fill="#a85507" font-size="24">打开小程序查看完整清单、勾选和备注。</text></svg>`

  return {
    taskAccepted: false,
    imageAssetId: null,
    imageDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    mimeType: 'image/svg+xml'
  }
}
