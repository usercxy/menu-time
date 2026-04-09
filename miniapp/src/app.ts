import { createElement, type PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { envConfig } from '@/constants/env'
import { AppProviders } from '@/providers/AppProviders'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.info('Menu Time miniapp launched.')
    if (envConfig.enableMock && envConfig.usesPlaceholderApi) {
      console.warn('TARO_APP_API_BASE_URL 未配置为可用地址，当前已自动切换到 mock 数据。')
    } else if (envConfig.enableMock && envConfig.mockScopes.length) {
      console.info(`当前启用局部 mock：${envConfig.mockScopes.join(', ')}`)
    }
  })

  return createElement(AppProviders, null, children)
}

export default App
