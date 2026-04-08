import type { CurrentWeekPlanDTO } from '@/services/types/meal-plan'

export const mockCurrentWeekPlan: CurrentWeekPlanDTO = {
  summary: {
    weekLabel: '三月第四周',
    completedMeals: 3,
    targetMeals: 5,
    summary: '距离本周目标还差 2 顿，适合再补一锅暖汤和一道家常肉菜。'
  },
  todayMeals: [
    { id: 'meal_1', mealType: '早餐', recipeName: '溏心蛋配吐司', note: '10 分钟快手完成' },
    { id: 'meal_2', mealType: '午餐', recipeName: '雨后田野沙拉', note: '适合清爽解腻' },
    { id: 'meal_3', mealType: '晚餐', recipeName: '外婆的红烧肉', note: '今晚家人都在，值得慢炖' }
  ]
}
