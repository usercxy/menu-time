import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { PageContainer } from '@/components/base/PageContainer'
import { envConfig } from '@/constants/env'
import { authService } from '@/services/modules/auth'
import { useSessionStore } from '@/store/session'
import { formatErrorForLog } from '@/utils/network-error'
import { queryClient } from '@/utils/query-client'
import { clearTokenBundle, getTokenBundle, setTokenBundle } from '@/utils/token-storage'

export default function SettingsPage() {
  const session = useSessionStore((state) => state.session)
  const status = useSessionStore((state) => state.status)
  const storedTokenBundle = useSessionStore((state) => state.tokenBundle)
  const setSession = useSessionStore((state) => state.setSession)
  const setStoredTokenBundle = useSessionStore((state) => state.setTokenBundle)
  const clearSession = useSessionStore((state) => state.clearSession)

  const tokenBundle = storedTokenBundle || getTokenBundle()
  const authDebugDisabled = envConfig.isMockScopeEnabled('auth')

  const showToast = (title: string, icon: 'none' | 'success' = 'none') =>
    Taro.showToast({
      title,
      icon
    })

  const handleInvalidateAccessToken = () => {
    if (!tokenBundle) {
      void showToast('当前没有可用 token')
      return
    }

    const nextTokenBundle = {
      ...tokenBundle,
      accessToken: `invalid-access-token-${Date.now()}`
    }

    setTokenBundle(nextTokenBundle)
    setStoredTokenBundle(nextTokenBundle)
    void showToast('已伪造 access token')
  }

  const handleInvalidateRefreshFlow = () => {
    if (!tokenBundle) {
      void showToast('当前没有可用 token')
      return
    }

    const nextTokenBundle = {
      ...tokenBundle,
      accessToken: `invalid-access-token-${Date.now()}`,
      refreshToken: `invalid-refresh-token-${Date.now()}`
    }

    setTokenBundle(nextTokenBundle)
    setStoredTokenBundle(nextTokenBundle)
    void showToast('已伪造 refresh 失败场景')
  }

  const handleClearAuthState = async () => {
    clearTokenBundle()
    clearSession()
    await queryClient.invalidateQueries({ queryKey: ['auth'] })
    void showToast('本地登录态已清空', 'success')
  }

  const handleDevLogin = async () => {
    if (process.env.TARO_ENV !== 'weapp') {
      void showToast('请在微信小程序环境下使用')
      return
    }

    try {
      const loginResult = await Taro.login()
      if (!loginResult.code) {
        throw new Error('wx.login 未返回有效 code')
      }

      const loginPayload = await authService.login({ code: loginResult.code })
      setTokenBundle(loginPayload.tokens)
      setStoredTokenBundle(loginPayload.tokens)
      setSession(loginPayload.session)
      await queryClient.invalidateQueries({ queryKey: ['auth'] })
      void showToast('已重新登录', 'success')
    } catch (error) {
      console.warn('开发态重新登录失败', formatErrorForLog(error))
      void showToast('重新登录失败')
    }
  }

  return (
    <PageContainer title="设置" subtitle="环境与调试信息" showBack>
      <View className="page-stack">
        <View className="surface-card">
          <Text className="section-title">开发环境</Text>
          <View className="page-stack">
            <View className="menu-slot">
              <View className="menu-slot__meta">
                <Text className="menu-slot__title">构建模式</Text>
                <Text className="menu-slot__subtitle">{envConfig.modeName}</Text>
              </View>
            </View>
            <View className="menu-slot">
              <View className="menu-slot__meta">
                <Text className="menu-slot__title">API 地址</Text>
                <Text className="menu-slot__subtitle">{envConfig.apiBaseUrl}</Text>
              </View>
            </View>
            <View className="menu-slot">
              <View className="menu-slot__meta">
                <Text className="menu-slot__title">Mock 开关</Text>
                <Text className="menu-slot__subtitle">{envConfig.enableMock ? '已开启' : '已关闭'}</Text>
              </View>
            </View>
            <View className="menu-slot">
              <View className="menu-slot__meta">
                <Text className="menu-slot__title">Mock 范围</Text>
                <Text className="menu-slot__subtitle">
                  {envConfig.mockScopes.length ? envConfig.mockScopes.join(', ') : '全部真实接口'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="surface-card">
          <Text className="section-title">登录状态</Text>
          <View className="page-stack">
            <View className="menu-slot">
              <View className="menu-slot__meta">
                <Text className="menu-slot__title">当前会话状态</Text>
                <Text className="menu-slot__subtitle">{status}</Text>
              </View>
            </View>
            <View className="menu-slot">
              <View className="menu-slot__meta">
                <Text className="menu-slot__title">当前昵称</Text>
                <Text className="menu-slot__subtitle">{session?.nickname || '匿名态'}</Text>
              </View>
            </View>
            <View className="menu-slot">
              <View className="menu-slot__meta">
                <Text className="menu-slot__title">Access Token</Text>
                <Text className="menu-slot__subtitle">
                  {tokenBundle?.accessToken ? `${tokenBundle.accessToken.slice(0, 18)}...` : '未持有'}
                </Text>
              </View>
            </View>
            <View className="menu-slot">
              <View className="menu-slot__meta">
                <Text className="menu-slot__title">Refresh Token</Text>
                <Text className="menu-slot__subtitle">
                  {tokenBundle?.refreshToken ? `${tokenBundle.refreshToken.slice(0, 18)}...` : '未持有'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {envConfig.isDev ? (
          <View className="surface-card">
            <Text className="section-title">联调调试面板</Text>
            <View className="page-stack">
              <View className="menu-slot">
                <View className="menu-slot__meta">
                  <Text className="menu-slot__title">使用说明</Text>
                  <Text className="menu-slot__subtitle">
                    先关闭 auth mock，再用下方按钮制造 token 场景，随后回首页或菜谱库发起真实请求。
                  </Text>
                </View>
              </View>
              {authDebugDisabled ? (
                <View className="menu-slot">
                  <View className="menu-slot__meta">
                    <Text className="menu-slot__title">当前不可用</Text>
                    <Text className="menu-slot__subtitle">`auth` 仍在 mock 范围内，真机验收前请先移除。</Text>
                  </View>
                </View>
              ) : (
                <>
                  <View className="primary-button" onClick={() => void handleDevLogin()}>
                    <Text>重新执行微信登录</Text>
                  </View>
                  <View className="secondary-button" onClick={handleInvalidateAccessToken}>
                    <Text>伪造 access token 失效</Text>
                  </View>
                  <View className="secondary-button" onClick={handleInvalidateRefreshFlow}>
                    <Text>伪造 refresh 失败场景</Text>
                  </View>
                  <View className="secondary-button" onClick={() => void handleClearAuthState()}>
                    <Text>清空本地登录态</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        ) : null}
      </View>
    </PageContainer>
  )
}
