import { useEffect } from 'react'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { envConfig } from '@/constants/env'
import { mockTokenBundle } from '@/mocks/session.mock'
import { authService } from '@/services/modules/auth'
import { useSessionStore } from '@/store/session'
import { getTokenBundle, setTokenBundle } from '@/utils/token-storage'

export const sessionQueryKey = ['auth', 'session'] as const

export function ensureMockTokenBundle() {
  if (envConfig.isMockScopeEnabled('auth') && !getTokenBundle()) {
    setTokenBundle(mockTokenBundle)
  }
}

export function useSessionQuery() {
  const setSession = useSessionStore((state) => state.setSession)
  const clearSession = useSessionStore((state) => state.clearSession)
  const setStoredTokenBundle = useSessionStore((state) => state.setTokenBundle)
  const tokenBundle = useSessionStore((state) => state.tokenBundle)

  const query = useQuery({
    queryKey: sessionQueryKey,
    queryFn: authService.getSession,
    enabled:
      envConfig.isMockScopeEnabled('auth') || Boolean(tokenBundle?.accessToken || getTokenBundle()?.accessToken),
    staleTime: 5 * 60_000
  })

  useEffect(() => {
    ensureMockTokenBundle()
    setStoredTokenBundle(getTokenBundle() || null)
  }, [setStoredTokenBundle])

  useEffect(() => {
    if (query.data) {
      setSession(query.data)
    } else if (query.isError) {
      clearSession()
    }
  }, [clearSession, query.data, query.isError, setSession])

  return query
}
