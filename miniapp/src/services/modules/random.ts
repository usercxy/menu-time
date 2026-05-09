import { request } from '@/services/request/client'
import type {
  RandomPickRedrawResultDTO,
  RandomPickResultAcceptPayload,
  RandomPickResultAcceptResultDTO,
  RandomPickResultSkipResultDTO,
  RandomPickSessionCreatePayload,
  RandomPickSessionCreateResultDTO,
  RandomPickSessionDetailDTO
} from '@/services/types/random'

export const randomService = {
  async createRandomPickSession(payload: RandomPickSessionCreatePayload) {
    const response = await request<RandomPickSessionCreateResultDTO>({
      url: '/api/v1/random-picks/sessions',
      method: 'POST',
      data: payload
    })

    return response.data
  },
  async getRandomPickSessionDetail(id: string) {
    const response = await request<RandomPickSessionDetailDTO>({
      url: `/api/v1/random-picks/sessions/${id}`
    })

    return response.data
  },
  async redrawRandomPickSession(id: string) {
    const response = await request<RandomPickRedrawResultDTO>({
      url: `/api/v1/random-picks/sessions/${id}/redraw`,
      method: 'POST'
    })

    return response.data
  },
  async acceptRandomPickResult(sessionId: string, resultId: string, payload: RandomPickResultAcceptPayload) {
    const response = await request<RandomPickResultAcceptResultDTO>({
      url: `/api/v1/random-picks/sessions/${sessionId}/results/${resultId}/accept`,
      method: 'POST',
      data: payload
    })

    return response.data
  },
  async skipRandomPickResult(sessionId: string, resultId: string) {
    const response = await request<RandomPickResultSkipResultDTO>({
      url: `/api/v1/random-picks/sessions/${sessionId}/results/${resultId}/skip`,
      method: 'POST'
    })

    return response.data
  }
}
