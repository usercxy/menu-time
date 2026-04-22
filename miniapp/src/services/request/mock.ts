import { envConfig } from '@/constants/env'
import {
  createMockMealPlanItem,
  deleteMockMealPlanItem,
  getMockCurrentWeekPlan,
  getMockWeekPlan,
  reorderMockMealPlanItems,
  updateMockMealPlanItem
} from '@/mocks/meal-plan.mock'
import {
  createMockMediaAsset,
  createMockMoment,
  createMockUploadToken,
  deleteMockMoment,
  getMockLatestMoments,
  getMockRecipeMoments,
  updateMockMoment
} from '@/mocks/moment.mock'
import {
  createMockRecipe,
  updateMockRecipe,
  createMockRecipeVersion,
  getMockRecipeCompare,
  getMockRecipeDetail,
  getMockRecipeList,
  getMockRecipeVersionDetail,
  getMockRecipeVersions,
  setMockCurrentRecipeVersion
} from '@/mocks/recipe.mock'
import { mockSession, mockTokenBundle, mockWechatLogin } from '@/mocks/session.mock'
import {
  createMockCategory,
  createMockTag,
  getMockCategories,
  getMockTags,
  updateMockCategory,
  updateMockTag
} from '@/mocks/taxonomy.mock'
import type {
  CreateUploadTokenPayload,
  RegisterMediaAssetPayload
} from '@/services/types/media'
import type {
  CreateMealPlanItemPayload,
  ReorderMealPlanItemsPayload,
  UpdateMealPlanItemPayload
} from '@/services/types/meal-plan'
import type {
  CreateMomentPayload,
  GetLatestMomentsQuery,
  GetRecipeMomentsQuery,
  UpdateMomentPayload
} from '@/services/types/moment'
import type {
  CreateRecipePayload,
  CreateVersionPayload,
  GetRecipesQuery,
  UpdateRecipePayload
} from '@/services/types/recipe'
import type { CategoryMutationPayload, TagMutationPayload } from '@/services/types/taxonomy'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface MockContext {
  url: string
  method: HttpMethod
  data?: unknown
}

interface MockRoute {
  method: HttpMethod
  matcher: RegExp
  handler: (context: MockContext) => unknown
}

const routes: MockRoute[] = [
  { method: 'GET', matcher: /^\/api\/v1\/auth\/session$/, handler: () => mockSession },
  { method: 'POST', matcher: /^\/api\/v1\/auth\/wechat-login$/, handler: () => mockWechatLogin },
  { method: 'POST', matcher: /^\/api\/v1\/auth\/refresh$/, handler: () => ({ session: mockSession, tokens: mockTokenBundle }) },
  { method: 'POST', matcher: /^\/api\/v1\/auth\/logout$/, handler: () => ({ success: true }) },
  { method: 'GET', matcher: /^\/api\/v1\/categories$/, handler: () => getMockCategories() },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/categories$/,
    handler: ({ data }) => createMockCategory(data as CategoryMutationPayload)
  },
  {
    method: 'PATCH',
    matcher: /^\/api\/v1\/categories\/[^/]+$/,
    handler: ({ url, data }) => updateMockCategory(url.split('/').pop() || '', data as CategoryMutationPayload)
  },
  { method: 'GET', matcher: /^\/api\/v1\/tags$/, handler: () => getMockTags() },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/tags$/,
    handler: ({ data }) => createMockTag(data as TagMutationPayload)
  },
  {
    method: 'PATCH',
    matcher: /^\/api\/v1\/tags\/[^/]+$/,
    handler: ({ url, data }) => updateMockTag(url.split('/').pop() || '', data as TagMutationPayload)
  },
  {
    method: 'GET',
    matcher: /^\/api\/v1\/recipes$/,
    handler: ({ data }) => getMockRecipeList((data || {}) as GetRecipesQuery)
  },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/recipes$/,
    handler: ({ data }) => createMockRecipe(data as CreateRecipePayload)
  },
  {
    method: 'PATCH',
    matcher: /^\/api\/v1\/recipes\/[^/]+$/,
    handler: ({ url, data }) => updateMockRecipe(url.split('/').pop() || '', data as UpdateRecipePayload)
  },
  {
    method: 'GET',
    matcher: /^\/api\/v1\/recipes\/[^/]+$/,
    handler: ({ url }) => {
      const recipeId = url.split('/').pop() || 'recipe_braised_pork'
      return getMockRecipeDetail(recipeId)
    }
  },
  {
    method: 'GET',
    matcher: /^\/api\/v1\/recipes\/[^/]+\/compare$/,
    handler: ({ url, data }) => {
      const segments = url.split('/')
      const payload = (data || {}) as { base?: number; target?: number }
      return getMockRecipeCompare(
        segments[4] || 'recipe_braised_pork',
        payload.base || 1,
        payload.target || 1
      )
    }
  },
  {
    method: 'GET',
    matcher: /^\/api\/v1\/recipes\/[^/]+\/versions$/,
    handler: ({ url, data }) => {
      const segments = url.split('/')
      return getMockRecipeVersions(segments[4] || 'recipe_braised_pork', (data || {}) as { page?: number; pageSize?: number })
    }
  },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/recipes\/[^/]+\/versions$/,
    handler: ({ url, data }) => {
      const segments = url.split('/')
      return createMockRecipeVersion(
        segments[4] || 'recipe_braised_pork',
        data as CreateVersionPayload
      )
    }
  },
  {
    method: 'GET',
    matcher: /^\/api\/v1\/recipes\/[^/]+\/versions\/[^/]+$/,
    handler: ({ url }) => {
      const segments = url.split('/')
      return getMockRecipeVersionDetail(
        segments[4] || 'recipe_braised_pork',
        segments[6] || ''
      )
    }
  },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/recipes\/[^/]+\/versions\/[^/]+\/set-current$/,
    handler: ({ url }) => {
      const segments = url.split('/')
      return setMockCurrentRecipeVersion(
        segments[4] || 'recipe_braised_pork',
        segments[6] || ''
      )
    }
  },
  {
    method: 'GET',
    matcher: /^\/api\/v1\/recipes\/[^/]+\/moments$/,
    handler: ({ url, data }) => {
      const segments = url.split('/')
      return getMockRecipeMoments(segments[4] || 'recipe_braised_pork', (data || {}) as GetRecipeMomentsQuery)
    }
  },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/recipes\/[^/]+\/moments$/,
    handler: ({ url, data }) => {
      const segments = url.split('/')
      return createMockMoment(segments[4] || 'recipe_braised_pork', data as CreateMomentPayload)
    }
  },
  {
    method: 'GET',
    matcher: /^\/api\/v1\/moments\/latest$/,
    handler: ({ data }) => getMockLatestMoments((data || {}) as GetLatestMomentsQuery)
  },
  {
    method: 'PATCH',
    matcher: /^\/api\/v1\/moments\/[^/]+$/,
    handler: ({ url, data }) => updateMockMoment(url.split('/').pop() || '', data as UpdateMomentPayload)
  },
  {
    method: 'DELETE',
    matcher: /^\/api\/v1\/moments\/[^/]+$/,
    handler: ({ url }) => deleteMockMoment(url.split('/').pop() || '')
  },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/files\/upload-token$/,
    handler: ({ data }) => createMockUploadToken(data as CreateUploadTokenPayload)
  },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/files\/assets$/,
    handler: ({ data }) => createMockMediaAsset(data as RegisterMediaAssetPayload)
  },
  { method: 'GET', matcher: /^\/api\/v1\/menu-plans\/current-week$/, handler: () => getMockCurrentWeekPlan() },
  {
    method: 'GET',
    matcher: /^\/api\/v1\/menu-plans\/weeks\/\d{4}-\d{2}-\d{2}$/,
    handler: ({ url }) => getMockWeekPlan(url.split('/').pop() || '')
  },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/menu-plans\/weeks\/\d{4}-\d{2}-\d{2}\/items$/,
    handler: ({ url, data }) => createMockMealPlanItem(url.split('/')[5] || '', data as CreateMealPlanItemPayload)
  },
  {
    method: 'PATCH',
    matcher: /^\/api\/v1\/menu-plans\/items\/[^/]+$/,
    handler: ({ url, data }) => updateMockMealPlanItem(url.split('/').pop() || '', data as UpdateMealPlanItemPayload)
  },
  {
    method: 'DELETE',
    matcher: /^\/api\/v1\/menu-plans\/items\/[^/]+$/,
    handler: ({ url }) => deleteMockMealPlanItem(url.split('/').pop() || '')
  },
  {
    method: 'POST',
    matcher: /^\/api\/v1\/menu-plans\/weeks\/\d{4}-\d{2}-\d{2}\/reorder$/,
    handler: ({ url, data }) => reorderMockMealPlanItems(url.split('/')[5] || '', data as ReorderMealPlanItemsPayload)
  }
]

export interface MockResponse<T> {
  data: T
  requestId: string
  statusCode: number
  fromMock: true
}

export async function resolveMockResponse<T>(context: MockContext): Promise<MockResponse<T> | null> {
  if (!envConfig.enableMock || !envConfig.shouldMockPath(context.url)) {
    return null
  }

  const route = routes.find((item) => item.method === context.method && item.matcher.test(context.url))
  if (!route) {
    return null
  }

  await new Promise((resolve) => setTimeout(resolve, 160))

  return {
    data: route.handler(context) as T,
    requestId: `mock_${Date.now()}`,
    statusCode: 200,
    fromMock: true
  }
}
