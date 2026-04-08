import { request } from '@/services/request/client'
import type {
  CategoryDTO,
  CategoryMutationPayload,
  TagDTO,
  TagMutationPayload
} from '@/services/types/taxonomy'

export const taxonomyService = {
  async getCategories() {
    const response = await request<CategoryDTO[]>({
      url: '/api/v1/categories'
    })
    return response.data
  },
  async createCategory(payload: CategoryMutationPayload) {
    const response = await request<CategoryDTO>({
      url: '/api/v1/categories',
      method: 'POST',
      data: payload
    })
    return response.data
  },
  async updateCategory(id: string, payload: CategoryMutationPayload) {
    const response = await request<CategoryDTO>({
      url: `/api/v1/categories/${id}`,
      method: 'PATCH',
      data: payload
    })
    return response.data
  },
  async getTags() {
    const response = await request<TagDTO[]>({
      url: '/api/v1/tags'
    })
    return response.data
  },
  async createTag(payload: TagMutationPayload) {
    const response = await request<TagDTO>({
      url: '/api/v1/tags',
      method: 'POST',
      data: payload
    })
    return response.data
  },
  async updateTag(id: string, payload: TagMutationPayload) {
    const response = await request<TagDTO>({
      url: `/api/v1/tags/${id}`,
      method: 'PATCH',
      data: payload
    })
    return response.data
  }
}
