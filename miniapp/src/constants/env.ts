const LOCAL_API_BASE_URL = 'http://127.0.0.1:3000'
const PLACEHOLDER_API_HOST = 'api.example.com'
const ALL_MOCK_SCOPES = ['auth', 'taxonomy', 'recipes', 'moments', 'media', 'meal-plan'] as const

export type MockScope = (typeof ALL_MOCK_SCOPES)[number]

const rawApiBaseUrl = process.env.TARO_APP_API_BASE_URL?.trim() || ''
const rawEnableMock = process.env.TARO_APP_ENABLE_MOCK?.trim().toLowerCase()
const rawMockScopes = process.env.TARO_APP_MOCK_SCOPES?.trim().toLowerCase() || ''
const isDev = process.env.NODE_ENV !== 'production'
const usesPlaceholderApi =
  !rawApiBaseUrl || rawApiBaseUrl.includes(PLACEHOLDER_API_HOST) || rawApiBaseUrl === LOCAL_API_BASE_URL

function resolveEnableMock() {
  if (rawEnableMock === 'true') {
    return true
  }

  if (rawEnableMock === 'false') {
    return false
  }

  return isDev || usesPlaceholderApi
}

function resolveMockScopes(enableMock: boolean): MockScope[] {
  if (!enableMock) {
    return []
  }

  if (rawMockScopes === 'none') {
    return []
  }

  if (rawMockScopes === 'all') {
    return [...ALL_MOCK_SCOPES]
  }

  if (rawMockScopes) {
    return rawMockScopes
      .split(',')
      .map((item) => item.trim())
      .filter((item): item is MockScope => ALL_MOCK_SCOPES.includes(item as MockScope))
  }

  if (usesPlaceholderApi) {
    return [...ALL_MOCK_SCOPES]
  }

  return ['meal-plan']
}

function shouldMockPath(path: string, mockScopes: MockScope[]) {
  const scopeMatchers: Record<MockScope, RegExp[]> = {
    auth: [/^\/api\/v1\/auth\//],
    taxonomy: [/^\/api\/v1\/categories/, /^\/api\/v1\/tags/],
    recipes: [/^\/api\/v1\/recipes/],
    moments: [/^\/api\/v1\/moments/],
    media: [/^\/api\/v1\/files/],
    'meal-plan': [/^\/api\/v1\/menu-plans/]
  }

  return mockScopes.some((scope) => scopeMatchers[scope].some((matcher) => matcher.test(path)))
}

const enableMock = resolveEnableMock()
const mockScopes = resolveMockScopes(enableMock)

export const envConfig = {
  appName: '食光记',
  apiBaseUrl: rawApiBaseUrl && !rawApiBaseUrl.includes(PLACEHOLDER_API_HOST) ? rawApiBaseUrl : LOCAL_API_BASE_URL,
  enableMock,
  mockScopes,
  isDev,
  modeName: process.env.NODE_ENV || 'development',
  usesPlaceholderApi,
  isMockScopeEnabled(scope: MockScope) {
    return mockScopes.includes(scope)
  },
  shouldMockPath(path: string) {
    return shouldMockPath(path, mockScopes)
  }
}

export const REQUEST_ID_HEADER = 'x-request-id'
