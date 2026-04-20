import { useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { envConfig } from '@/constants/env'
import { mockTokenBundle } from '@/mocks/session.mock'
import { authService } from '@/services/modules/auth'
import { useSessionStore } from '@/store/session'
import { formatErrorForLog } from '@/utils/network-error'
import { clearTokenBundle, getTokenBundle, setTokenBundle } from '@/utils/token-storage'

export function useAuthBootstrap() {
  const hasBootstrapped = useRef(false)
  const setSession = useSessionStore((state) => state.setSession)
  const setStoredTokenBundle = useSessionStore((state) => state.setTokenBundle)
  const clearSession = useSessionStore((state) => state.clearSession)

  useEffect(() => {
    if (hasBootstrapped.current) {
      return
    }

    hasBootstrapped.current = true

    const existingTokenBundle = getTokenBundle()
    if (existingTokenBundle?.accessToken) {
      setStoredTokenBundle(existingTokenBundle)
      return
    }

    if (envConfig.isMockScopeEnabled('auth')) {
      setTokenBundle(mockTokenBundle)
      setStoredTokenBundle(mockTokenBundle)
      return
    }

    if (process.env.TARO_ENV !== 'weapp') {
      console.warn('当前运行环境不支持 wx.login，已跳过自动登录初始化。')
      clearSession()
      return
    }

    let cancelled = false

    const bootstrapLogin = async () => {
      try {
        const loginResult = await Taro.login()
        if (!loginResult.code) {
          throw new Error('wx.login 未返回有效 code')
        }

        const loginPayload = await authService.login({ code: loginResult.code })
        if (cancelled) {
          return
        }

        const tokenBundle = loginPayload.tokens

        setTokenBundle(tokenBundle)
        setStoredTokenBundle(tokenBundle)
        setSession(loginPayload.session)
      } catch (error) {
        if (cancelled) {
          return
        }

        clearTokenBundle()
        clearSession()
        console.warn('自动登录初始化失败', formatErrorForLog(error))
      }
    }

    void bootstrapLogin()

    return () => {
      cancelled = true
    }
  }, [clearSession, setSession, setStoredTokenBundle])
}

export function AuthBootstrap() {
  useAuthBootstrap()
  return null
}
