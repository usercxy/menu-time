const LOCAL_API_BASE_URL = 'http://127.0.0.1:3000'
const PLACEHOLDER_API_HOST = 'api.example.com'

const rawApiBaseUrl = process.env.TARO_APP_API_BASE_URL?.trim() || ''
const rawEnableMock = process.env.TARO_APP_ENABLE_MOCK?.trim().toLowerCase()
const isDev = process.env.NODE_ENV !== 'production'
const usesPlaceholderApi =
  !rawApiBaseUrl || rawApiBaseUrl.includes(PLACEHOLDER_API_HOST) || rawApiBaseUrl === LOCAL_API_BASE_URL

function resolveEnableMock() {
  if (rawEnableMock === 'true') {
    return true
  }

  if (rawEnableMock === 'false') {
    // A placeholder API host means "not configured yet", so keep mock data on.
    return usesPlaceholderApi
  }

  return isDev || usesPlaceholderApi
}

export const envConfig = {
  appName: '食光记',
  apiBaseUrl: rawApiBaseUrl && !rawApiBaseUrl.includes(PLACEHOLDER_API_HOST) ? rawApiBaseUrl : LOCAL_API_BASE_URL,
  enableMock: resolveEnableMock(),
  isDev,
  modeName: process.env.NODE_ENV || 'development',
  usesPlaceholderApi
}

export const REQUEST_ID_HEADER = 'x-request-id'
