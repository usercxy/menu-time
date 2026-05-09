import { request } from '@/services/request/client'
import type {
  ShoppingListCopyTextResultDTO,
  ShoppingListDetailDTO,
  ShoppingListGeneratePayload,
  ShoppingListGenerateResultDTO,
  ShoppingListItemDTO,
  ShoppingListItemUpdatePayload,
  ShoppingListShareImageResultDTO
} from '@/services/types/shopping'

export const shoppingService = {
  async generateShoppingList(payload: ShoppingListGeneratePayload) {
    const response = await request<ShoppingListGenerateResultDTO>({
      url: '/api/v1/shopping-lists/generate',
      method: 'POST',
      data: {
        generatedFrom: 'manual',
        ...payload
      }
    })

    return response.data
  },
  async getShoppingListDetail(id: string) {
    const response = await request<ShoppingListDetailDTO>({
      url: `/api/v1/shopping-lists/${id}`
    })

    return response.data
  },
  async updateShoppingListItem(id: string, payload: ShoppingListItemUpdatePayload) {
    const response = await request<ShoppingListItemDTO>({
      url: `/api/v1/shopping-lists/items/${id}`,
      method: 'PATCH',
      data: payload
    })

    return response.data
  },
  async createShoppingListCopyText(id: string) {
    const response = await request<ShoppingListCopyTextResultDTO>({
      url: `/api/v1/shopping-lists/${id}/copy-text`,
      method: 'POST'
    })

    return response.data
  },
  async createShoppingListShareImage(id: string) {
    const response = await request<ShoppingListShareImageResultDTO>({
      url: `/api/v1/shopping-lists/${id}/share-image`,
      method: 'POST'
    })

    return response.data
  }
}
