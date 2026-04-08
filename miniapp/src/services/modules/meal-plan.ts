import { request } from '@/services/request/client'
import type { CurrentWeekPlanDTO } from '@/services/types/meal-plan'

export const mealPlanService = {
  async getCurrentWeekPlan() {
    const response = await request<CurrentWeekPlanDTO>({
      url: '/api/v1/menu-plans/current-week'
    })
    return response.data
  }
}
