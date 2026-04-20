import { useEffect } from 'react'
import {
  useQuery,
  type DefaultError,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult
} from '@tanstack/react-query'
import { envConfig } from '@/constants/env'
import { queryClient } from '@/utils/query-client'
import { formatErrorForLog } from '@/utils/network-error'

export function useAppQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryResult<TData, TError> {
  const query = useQuery(options)
  const enabled = options.enabled ?? true

  useEffect(() => {
    if (
      !enabled ||
      query.data !== undefined ||
      query.isError ||
      query.isFetching ||
      query.fetchStatus !== 'idle' ||
      !options.queryFn
    ) {
      return
    }

    if (envConfig.isDev) {
      console.info('[useAppQuery] force fetch', options.queryKey)
    }

    void queryClient
      .fetchQuery({
        queryKey: options.queryKey,
        queryFn: options.queryFn,
        gcTime: options.gcTime,
        staleTime: options.staleTime,
        meta: options.meta,
        networkMode: options.networkMode ?? 'always'
      })
      .catch((error) => {
        if (envConfig.isDev) {
          console.warn('[useAppQuery] force fetch failed', options.queryKey, formatErrorForLog(error))
        }
      })
  }, [
    enabled,
    options.gcTime,
    options.meta,
    options.networkMode,
    options.queryFn,
    options.queryKey,
    options.staleTime,
    query.data,
    query.isError,
    query.fetchStatus,
    query.isFetching
  ])

  return query
}
