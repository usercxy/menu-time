import Taro from '@tarojs/taro'
import { REQUEST_ID_HEADER, envConfig } from '@/constants/env'
import { useSessionStore } from '@/store/session'
import type { ApiFailure, ApiResponse } from '@/services/types/api'
import type { AuthResultDTO, RefreshTokenPayload, TokenBundleDTO } from '@/services/types/auth'
import { formatErrorForLog, getNetworkTransportErrorInfo } from '@/utils/network-error'
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
  timeout?: number
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
const MAX_CONSECUTIVE_UNAUTHORIZED_REQUESTS = 5
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000

let consecutiveUnauthorizedCount = 0
let unauthorizedCycleKey = getUnauthorizedCycleKey()
let hasPromptedReenterMiniapp = false

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

function getUnauthorizedCycleKey() {
  const tokenBundle = getTokenBundle()
  return tokenBundle?.refreshToken || tokenBundle?.accessToken || 'anonymous'
}

function resetUnauthorizedState(nextCycleKey = getUnauthorizedCycleKey()) {
  consecutiveUnauthorizedCount = 0
  unauthorizedCycleKey = nextCycleKey
  hasPromptedReenterMiniapp = false
}

function syncUnauthorizedState() {
  const nextCycleKey = getUnauthorizedCycleKey()

  if (nextCycleKey !== unauthorizedCycleKey && nextCycleKey !== 'anonymous') {
    resetUnauthorizedState(nextCycleKey)
  }
}

async function promptReenterMiniapp() {
  if (hasPromptedReenterMiniapp) {
    return
  }

  hasPromptedReenterMiniapp = true

  try {
    await Taro.showModal({
      title: '登录状态异常',
      content: '当前权限校验已连续失败 5 次，请退出后重新进入小程序再试。',
      showCancel: false,
      confirmText: '我知道了'
    })
  } catch (error) {
    console.warn('提示重新进入小程序失败', formatErrorForLog(error))
  }
}

function buildUnauthorizedLimitError() {
  return new RequestError({
    code: 'UNAUTHORIZED',
    message: '当前登录状态已失效，请重新进入小程序后再试',
    requestId: '',
    statusCode: 401
  })
}

function recordUnauthorizedFailure() {
  consecutiveUnauthorizedCount += 1

  if (envConfig.isDev) {
    console.warn(
      `[request:unauthorized] consecutive failures ${consecutiveUnauthorizedCount}/${MAX_CONSECUTIVE_UNAUTHORIZED_REQUESTS}`
    )
  }

  if (consecutiveUnauthorizedCount >= MAX_CONSECUTIVE_UNAUTHORIZED_REQUESTS) {
    void promptReenterMiniapp()
  }
}

function normalizeRequestError(error: unknown, operation = '请求') {
  if (error instanceof RequestError) {
    return error
  }

  const transportError = getNetworkTransportErrorInfo(error, operation)
  if (transportError) {
    return new RequestError({
      code: transportError.code,
      message: transportError.message,
      requestId: '',
      statusCode: 0,
      details: {
        rawMessage: transportError.rawMessage
      }
    })
  }

  return error
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

  let response: Taro.request.SuccessCallbackResult<ApiResponse<TData>>

  try {
    response = await Taro.request<ApiResponse<TData>>({
      url: normalizeUrl(options.url),
      method,
      data: normalizedData,
      header: headers,
      timeout: options.timeout ?? DEFAULT_REQUEST_TIMEOUT_MS
    })
  } catch (error) {
    throw normalizeRequestError(error)
  }

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
  if (options.auth !== false) {
    syncUnauthorizedState()

    if (consecutiveUnauthorizedCount >= MAX_CONSECUTIVE_UNAUTHORIZED_REQUESTS) {
      void promptReenterMiniapp()
      throw buildUnauthorizedLimitError()
    }
  }

  try {
    const result = await rawRequest<TData>(options)

    if (options.auth !== false) {
      resetUnauthorizedState()
    }

    return result
  } catch (error) {
    if (
      error instanceof RequestError &&
      error.code === 'UNAUTHORIZED' &&
      options.auth !== false &&
      options.retryOnAuthError !== false
    ) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        try {
          const retryResult = await rawRequest<TData>({
            ...options,
            retryOnAuthError: false
          })

          resetUnauthorizedState()
          return retryResult
        } catch (retryError) {
          if (retryError instanceof RequestError && retryError.code === 'UNAUTHORIZED') {
            recordUnauthorizedFailure()
          }

          throw retryError
        }
      }

      clearTokenBundle()
      useSessionStore.getState().clearSession()
      recordUnauthorizedFailure()
    }

    throw normalizeRequestError(error)
  }
}
