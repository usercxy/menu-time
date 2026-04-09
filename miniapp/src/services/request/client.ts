import Taro from '@tarojs/taro'
import { REQUEST_ID_HEADER, envConfig } from '@/constants/env'
import { useSessionStore } from '@/store/session'
import type { ApiFailure, ApiResponse } from '@/services/types/api'
import type { AuthResultDTO, RefreshTokenPayload, TokenBundleDTO } from '@/services/types/auth'
import { clearTokenBundle, getTokenBundle, setTokenBundle } from '@/utils/token-storage'
import { resolveMockResponse } from './mock'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  url: string
  method?: HttpMethod
  data?: unknown
  auth?: boolean
  headers?: Record<string, string>
  retryOnAuthError?: boolean
}

export interface RequestResult<TData> {
  data: TData
  requestId: string
  statusCode: number
  fromMock?: boolean
}

export class RequestError extends Error {
  code: ApiFailure['error']['code']
  requestId: string
  statusCode: number
  details?: unknown

  constructor(payload: {
    code: ApiFailure['error']['code']
    message: string
    requestId: string
    statusCode: number
    details?: unknown
  }) {
    super(payload.message)
    this.name = 'RequestError'
    this.code = payload.code
    this.requestId = payload.requestId
    this.statusCode = payload.statusCode
    this.details = payload.details
  }
}

let refreshPromise: Promise<TokenBundleDTO | null> | null = null

function logDevRequest(message: string, payload?: unknown) {
  if (!envConfig.isDev) {
    return
  }

  if (payload === undefined) {
    console.info(message)
    return
  }

  console.info(message, payload)
}

function stripNullish<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripNullish(item))
      .filter((item) => item !== undefined && item !== null) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined && entryValue !== null)
        .map(([key, entryValue]) => [key, stripNullish(entryValue)])
    ) as T
  }

  return value
}

function normalizeUrl(url: string) {
  if (url.startsWith('http')) {
    return url
  }

  return `${envConfig.apiBaseUrl}${url}`
}

async function rawRequest<TData>(options: RequestOptions) {
  const method = options.method ?? 'GET'
  const normalizedData = options.data === undefined ? undefined : stripNullish(options.data)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (options.auth !== false) {
    const tokenBundle = getTokenBundle()
    if (tokenBundle?.accessToken) {
      headers.Authorization = `Bearer ${tokenBundle.accessToken}`
    }
  }

  const mockResponse = await resolveMockResponse<TData>({
    url: options.url,
    method,
    data: normalizedData
  })
  if (mockResponse) {
    logDevRequest(`[request:mock] ${method} ${options.url}`, normalizedData)
    return mockResponse
  }

  logDevRequest(`[request:http] ${method} ${normalizeUrl(options.url)}`, normalizedData)

  const response = await Taro.request<ApiResponse<TData>>({
    url: normalizeUrl(options.url),
    method,
    data: normalizedData,
    header: headers
  })

  const requestId =
    response.data.requestId ||
    String(response.header?.[REQUEST_ID_HEADER] || response.header?.[REQUEST_ID_HEADER.toUpperCase()] || '')

  if (!response.data.success) {
    throw new RequestError({
      code: response.data.error.code,
      message: response.data.error.message,
      requestId,
      statusCode: response.statusCode,
      details: response.data.error.details
    })
  }

  return {
    data: response.data.data,
    requestId,
    statusCode: response.statusCode
  }
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise
  }

  const refreshToken = getTokenBundle()?.refreshToken
  if (!refreshToken) {
    useSessionStore.getState().clearSession()
    return null
  }

  refreshPromise = rawRequest<AuthResultDTO>({
    url: '/api/v1/auth/refresh',
    method: 'POST',
    auth: false,
    retryOnAuthError: false,
    data: {
      refreshToken
    } satisfies RefreshTokenPayload
  })
    .then((result) => {
      setTokenBundle(result.data.tokens)
      useSessionStore.getState().setTokenBundle(result.data.tokens)
      return result.data.tokens
    })
    .catch(() => {
      clearTokenBundle()
      useSessionStore.getState().clearSession()
      return null
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function request<TData>(options: RequestOptions): Promise<RequestResult<TData>> {
  try {
    return await rawRequest(options)
  } catch (error) {
    if (
      error instanceof RequestError &&
      error.code === 'UNAUTHORIZED' &&
      options.auth !== false &&
      options.retryOnAuthError !== false
    ) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return rawRequest({
          ...options,
          retryOnAuthError: false
        })
      }

      clearTokenBundle()
      useSessionStore.getState().clearSession()
    }

    throw error
  }
}
