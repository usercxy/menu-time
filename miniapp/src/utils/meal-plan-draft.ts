import Taro from '@tarojs/taro'
import { storageKeys } from '@/constants/storage'
import type { MealPlanSlotKey } from '@/services/types/meal-plan'

export interface MealPlanDraft {
  recipeId: string
  recipeName?: string
  recipeVersionId?: string
  recipeVersionLabel?: string
  plannedDate?: string
  mealSlot?: MealPlanSlotKey
  note?: string
}

export function setMealPlanDraft(draft: MealPlanDraft) {
  Taro.setStorageSync(storageKeys.plannerDraft, draft)
}

export function getMealPlanDraft() {
  try {
    return Taro.getStorageSync(storageKeys.plannerDraft) as MealPlanDraft | null
  } catch {
    return null
  }
}

export function clearMealPlanDraft() {
  try {
    Taro.removeStorageSync(storageKeys.plannerDraft)
  } catch {
    // ignore storage cleanup failures
  }
}
