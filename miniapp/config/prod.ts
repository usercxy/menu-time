import type { UserConfigExport } from '@tarojs/cli'

export default {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
    __DEVTOOLS__: 'false'
  }
} satisfies UserConfigExport<'webpack5'>
