import type { UserConfigExport } from '@tarojs/cli'

export default {
  env: {
    NODE_ENV: '"development"',
    TARO_APP_API_BASE_URL: '"http://127.0.0.1:3000"',
    TARO_APP_ENABLE_MOCK: '"true"',
    TARO_APP_MOCK_SCOPES: '"meal-plan"'
  },
  defineConstants: {
    __DEVTOOLS__: 'true'
  }
} satisfies UserConfigExport<'webpack5'>
