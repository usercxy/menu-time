import { Text, View } from '@tarojs/components'
import { PageContainer } from '@/components/base/PageContainer'
import { envConfig } from '@/constants/env'

export default function SettingsPage() {
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
          </View>
        </View>
      </View>
    </PageContainer>
  )
}
