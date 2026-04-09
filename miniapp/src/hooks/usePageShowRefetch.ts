import { useRef } from 'react'
import { useDidShow } from '@tarojs/taro'
import { envConfig } from '@/constants/env'

interface RefreshableQuery {
  refetch: () => Promise<unknown>
  data?: unknown
  isFetching?: boolean
  fetchStatus?: string
}

interface UsePageShowRefetchOptions {
  skipFirstShow?: boolean
}

export function usePageShowRefetch(
  queries: Array<RefreshableQuery | null | undefined>,
  options: UsePageShowRefetchOptions = {}
) {
  const { skipFirstShow = true } = options
  const hasShownRef = useRef(false)

  useDidShow(() => {
    if (skipFirstShow && !hasShownRef.current) {
      hasShownRef.current = true
      const pendingQueries = queries
        .filter((query): query is RefreshableQuery => Boolean(query))
        .filter((query) => !query.data && !query.isFetching)
      if (envConfig.isDev && pendingQueries.length) {
        console.info(
          `[page-show-refetch] first show fallback: ${pendingQueries.length} query(s)`,
          pendingQueries.map((query) => query.fetchStatus || 'unknown')
        )
      }
      pendingQueries.forEach((query) => {
        void query.refetch()
      })
      return
    }

    hasShownRef.current = true
    if (envConfig.isDev && queries.length) {
      console.info(
        `[page-show-refetch] page show refetch: ${queries.filter(Boolean).length} query(s)`,
        queries.filter(Boolean).map((query) => query?.fetchStatus || 'unknown')
      )
    }
    queries.forEach((query) => {
      if (query) {
        void query.refetch()
      }
    })
  })
}
