export interface ApiSuccess<T> {
  success: true
  data: T
  requestId: string
}

export interface ApiFailure {
  success: false
  error: {
    code:
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'VALIDATION_ERROR'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'BUSINESS_RULE_VIOLATION'
      | 'NETWORK_TIMEOUT'
      | 'NETWORK_ERROR'
      | 'INTERNAL_ERROR'
    message: string
    details?: unknown
  }
  requestId: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export interface PaginationQuery {
  page?: number
  pageSize?: number
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface NamedRefDTO {
  id: string
  name: string
}
