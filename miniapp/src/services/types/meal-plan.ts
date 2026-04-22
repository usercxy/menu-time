export type MealPlanWeekStatus = 'draft' | 'finalized'
export type MealPlanSourceType = 'manual' | 'random'
export type MealPlanSlotKey = 'lunch' | 'dinner' | 'extra'

export interface MealPlanSummaryDTO {
  weekLabel: string
  completedMeals: number
  targetMeals: number
  summary: string
}

export interface MealSlotDTO {
  id: string
  mealType: '午餐' | '晚餐' | '加餐'
  recipeName: string
  note: string
  plannedDate: string
  coverImageUrl?: string | null
}

export interface MealWeekDayDTO {
  key: string
  name: string
  dateLabel: string
  fullDate: string
  mealCount: number
  active: boolean
}

export interface MealPlanItemDTO {
  id: string
  plannedDate: string
  mealSlot: MealPlanSlotKey
  sortOrder: number
  sourceType: MealPlanSourceType
  note: string | null
  recipe: {
    id: string
    name: string
    coverImageUrl: string | null
    status: string
    isDeleted: boolean
  }
  recipeVersion: {
    id: string
    versionNumber: number
    versionName: string | null
  }
  createdAt: string
  updatedAt: string
}

export interface MealPlanWeekRawDTO {
  id: string
  weekStartDate: string
  status: MealPlanWeekStatus
  plannedItemCount: number
  items: MealPlanItemDTO[]
}

export interface CreateMealPlanItemPayload {
  recipeId: string
  recipeVersionId: string
  plannedDate: string
  mealSlot: MealPlanSlotKey
  note?: string | null
  sourceType?: MealPlanSourceType
}

export interface UpdateMealPlanItemPayload {
  recipeVersionId?: string
  plannedDate?: string
  mealSlot?: MealPlanSlotKey
  note?: string | null
}

export interface ReorderMealPlanItemsPayload {
  plannedDate: string
  mealSlot: MealPlanSlotKey
  items: Array<{
    id: string
    sortOrder: number
  }>
}

export interface MealPlanMutationResultDTO {
  id: string
}

export interface DeleteMealPlanItemResultDTO {
  deleted: true
}

export interface CurrentWeekPlanDTO {
  id: string
  weekStartDate: string
  status: MealPlanWeekStatus
  plannedItemCount: number
  items: MealPlanItemDTO[]
  summary: MealPlanSummaryDTO
  todayMeals: MealSlotDTO[]
  weekDays: MealWeekDayDTO[]
}
