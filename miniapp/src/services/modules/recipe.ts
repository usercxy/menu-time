import { request } from '@/services/request/client'
import type {
  CompareVersionsDTO,
  CreateRecipePayload,
  CreateRecipeResultDTO,
  CreateVersionPayload,
  CreateVersionResultDTO,
  GetRecipesQuery,
  RecipeDetailDTO,
  UpdateRecipePayload,
  RecipeVersionDetailDTO,
  RecipeListResultDTO,
  RecipeVersionListResultDTO
} from '@/services/types/recipe'

export const recipeService = {
  async getRecipes(query: GetRecipesQuery = {}) {
    const normalizedQuery = {
      ...query,
      tagIds: query.tagIds?.length ? query.tagIds.join(',') : undefined
    }
    const response = await request<RecipeListResultDTO>({
      url: '/api/v1/recipes',
      data: normalizedQuery
    })
    return response.data
  },
  async getRecipeDetail(id: string) {
    const response = await request<RecipeDetailDTO>({
      url: `/api/v1/recipes/${id}`
    })
    return response.data
  },
  async createRecipe(payload: CreateRecipePayload) {
    const response = await request<CreateRecipeResultDTO>({
      url: '/api/v1/recipes',
      method: 'POST',
      data: payload
    })
    return response.data
  },
  async updateRecipe(id: string, payload: UpdateRecipePayload) {
    await request<{ success: true }>({
      url: `/api/v1/recipes/${id}`,
      method: 'PATCH',
      data: payload
    })
  },
  async getRecipeVersions(recipeId: string, query: { page?: number; pageSize?: number } = {}) {
    const response = await request<RecipeVersionListResultDTO>({
      url: `/api/v1/recipes/${recipeId}/versions`,
      data: query
    })
    return response.data
  },
  async getRecipeVersionDetail(recipeId: string, versionId: string) {
    const response = await request<RecipeVersionDetailDTO>({
      url: `/api/v1/recipes/${recipeId}/versions/${versionId}`
    })
    return response.data
  },
  async createRecipeVersion(recipeId: string, payload: CreateVersionPayload) {
    const response = await request<CreateVersionResultDTO>({
      url: `/api/v1/recipes/${recipeId}/versions`,
      method: 'POST',
      data: payload
    })
    return response.data
  },
  async compareRecipeVersions(recipeId: string, baseVersionNumber: number, targetVersionNumber: number) {
    const response = await request<CompareVersionsDTO>({
      url: `/api/v1/recipes/${recipeId}/compare`,
      data: {
        base: baseVersionNumber,
        target: targetVersionNumber
      }
    })
    return response.data
  },
  async setCurrentRecipeVersion(recipeId: string, versionId: string) {
    const response = await request<{ success: true }>({
      url: `/api/v1/recipes/${recipeId}/versions/${versionId}/set-current`,
      method: 'POST'
    })
    return response.data
  }
}
