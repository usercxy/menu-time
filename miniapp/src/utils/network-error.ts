export type NetworkTransportErrorCode = 'NETWORK_TIMEOUT' | 'NETWORK_ERROR'

const TIMEOUT_ERROR_PATTERN = /timeout|timed out|超时|请求超时/i
const NETWORK_ERROR_PATTERN =
  /request:fail|uploadfile:fail|downloadfile:fail|network|net::|err_|socket|ssl|url not in domain list|abort/i

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    const payload = error as { message?: unknown; errMsg?: unknown }
    const message = typeof payload.message === 'string' ? payload.message : ''
    const errMsg = typeof payload.errMsg === 'string' ? payload.errMsg : ''

    return message || errMsg
  }

  return ''
}

export function getErrorSummary(error: unknown) {
  const message = readErrorMessage(error)
  if (message) {
    return message.split('\n')[0].trim()
  }

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export function isTimeoutLikeError(error: unknown) {
  return TIMEOUT_ERROR_PATTERN.test(getErrorSummary(error))
}

export function getNetworkTransportErrorInfo(error: unknown, operation = '请求') {
  const rawMessage = getErrorSummary(error)

  if (isTimeoutLikeError(error)) {
    return {
      code: 'NETWORK_TIMEOUT' as const,
      message: `${operation}超时，请检查网络后重试`,
      rawMessage
    }
  }

  if (NETWORK_ERROR_PATTERN.test(rawMessage)) {
    return {
      code: 'NETWORK_ERROR' as const,
      message: `${operation}失败，请检查网络后重试`,
      rawMessage
    }
  }

  return null
}

export function formatErrorForLog(error: unknown) {
  if (error && typeof error === 'object') {
    const payload = error as {
      name?: unknown
      code?: unknown
      statusCode?: unknown
      requestId?: unknown
      message?: unknown
      errMsg?: unknown
    }

    return {
      name: typeof payload.name === 'string' ? payload.name : 'Error',
      code: payload.code,
      statusCode: payload.statusCode,
      requestId: payload.requestId,
      message: getErrorSummary(error) || payload.errMsg
    }
  }

  return {
    name: 'Error',
    message: getErrorSummary(error)
  }
}
