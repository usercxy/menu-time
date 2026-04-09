import type { UserConfigExport } from '@tarojs/cli'

export default {
  env: {
    NODE_ENV: '"production"',
    TARO_APP_API_BASE_URL: '"https://api.example.com"',
    TARO_APP_ENABLE_MOCK: '"false"',
    TARO_APP_MOCK_SCOPES: '""'
  },
  defineConstants: {
    __DEVTOOLS__: 'false'
  }
} satisfies UserConfigExport<'webpack5'>
