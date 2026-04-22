import { request } from '@/services/request/client'
import type {
  CreateMomentPayload,
  GetLatestMomentsQuery,
  GetRecipeMomentsQuery,
  LatestMomentListResultDTO,
  MomentItemDTO,
  RecipeMomentListResultDTO,
  UpdateMomentPayload
} from '@/services/types/moment'

export const momentService = {
  async getRecipeMoments(recipeId: string, query: GetRecipeMomentsQuery = {}) {
    const response = await request<RecipeMomentListResultDTO>({
      url: `/api/v1/recipes/${recipeId}/moments`,
      data: query
    })

    return response.data
  },
  async getLatestMoments(query: GetLatestMomentsQuery = {}) {
    const response = await request<LatestMomentListResultDTO>({
      url: '/api/v1/moments/latest',
      data: query
    })

    return response.data
  },
  async createMoment(recipeId: string, payload: CreateMomentPayload) {
    const response = await request<MomentItemDTO>({
      url: `/api/v1/recipes/${recipeId}/moments`,
      method: 'POST',
      data: payload
    })

    return response.data
  },
  async updateMoment(momentId: string, payload: UpdateMomentPayload) {
    const response = await request<MomentItemDTO>({
      url: `/api/v1/moments/${momentId}`,
      method: 'PATCH',
      data: payload
    })

    return response.data
  },
  async deleteMoment(momentId: string) {
    const response = await request<{ success: true }>({
      url: `/api/v1/moments/${momentId}`,
      method: 'DELETE'
    })

    return response.data
  }
}
