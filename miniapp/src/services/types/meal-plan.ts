export interface MealPlanSummaryDTO {
  weekLabel: string
  completedMeals: number
  targetMeals: number
  summary: string
}

export interface MealSlotDTO {
  id: string
  mealType: '早餐' | '午餐' | '晚餐' | '加餐'
  recipeName: string
  note: string
}

export interface CurrentWeekPlanDTO {
  summary: MealPlanSummaryDTO
  todayMeals: MealSlotDTO[]
}
