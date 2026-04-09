import { useState } from 'react'
import { Image, Text, View } from '@tarojs/components'
import { routes } from '@/constants/routes'
import { ConfirmDialog } from '@/components/base/ConfirmDialog'
import { PageContainer } from '@/components/base/PageContainer'
import { useSessionQuery } from '@/features/auth/query'
import { navigateToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

export default function MyPage() {
  const [showDialog, setShowDialog] = useState(false)
  const sessionQuery = useSessionQuery()

  return (
    <PageContainer title="我的" subtitle="管理家庭记忆与设置">
      <View className="page-stack">
        {/* Profile Header */}
        <View className={styles.profileHeader}>
          <View className={styles.avatarWrap}>
            <View className={styles.avatar}>
              <Image 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" 
                mode="aspectFill" 
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <View className={styles.roleBadge}>
              <Text>家主</Text>
            </View>
          </View>
          <View>
            <Text className={styles.nickName}>{sessionQuery.data?.nickname || '林深见鹿'}</Text>
            <Text className={styles.motto}>传承家味，留存食光</Text>
            <View className={styles.familyBadge}>
              <Text>👨‍👩‍👧‍👦 林氏家族核心成员</Text>
            </View>
          </View>
        </View>

        {/* Statistics Grid */}
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>128</Text>
            <Text className={styles.statLabel}>菜谱创作</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>45</Text>
            <Text className={styles.statLabel}>时光记录</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>312</Text>
            <Text className={styles.statLabel}>版本存档</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View className={styles.menuGroup}>
          <View className={styles.menuItem} onClick={() => navigateToRoute(routes.categoryManage)}>
            <View className={styles.menuLeft}>
              <View className={`${styles.menuIcon} ${styles.bgTertiary}`} style={{ backgroundColor: 'var(--color-tertiary-container)' }}>
                <Text>📂</Text>
              </View>
              <Text className={styles.menuText}>分类管理</Text>
            </View>
            <Text style={{ color: 'var(--color-outline)', fontSize: '32px' }}>›</Text>
          </View>
          <View className={styles.divider} />
          <View className={styles.menuItem} onClick={() => navigateToRoute(routes.tagManage)}>
            <View className={styles.menuLeft}>
              <View className={`${styles.menuIcon}`} style={{ backgroundColor: 'var(--color-tertiary-container)' }}>
                <Text>🏷️</Text>
              </View>
              <Text className={styles.menuText}>标签体系</Text>
            </View>
            <Text style={{ color: 'var(--color-outline)', fontSize: '32px' }}>›</Text>
          </View>
        </View>

        <View className={styles.menuGroup}>
          <View className={styles.menuItem}>
            <View className={styles.menuLeft}>
              <View className={`${styles.menuIcon}`} style={{ backgroundColor: 'var(--color-secondary-container)' }}>
                <Text>👥</Text>
              </View>
              <Text className={styles.menuText}>家族协作</Text>
            </View>
            <View style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <View style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '2px 12px', borderRadius: '4px', fontSize: '18px', fontWeight: 700 }}>P1</View>
              <Text style={{ color: 'var(--color-outline)', fontSize: '32px' }}>›</Text>
            </View>
          </View>
        </View>

        <View className={styles.menuGroup}>
          <View className={styles.menuItem} onClick={() => navigateToRoute(routes.settings)}>
            <View className={styles.menuLeft}>
              <View className={`${styles.menuIcon}`} style={{ backgroundColor: 'var(--color-surface-container-highest)' }}>
                <Text>⚙️</Text>
              </View>
              <Text className={styles.menuText}>系统设置</Text>
            </View>
            <Text style={{ color: 'var(--color-outline)', fontSize: '32px' }}>›</Text>
          </View>
          <View className={styles.divider} />
          <View className={styles.menuItem} onClick={() => setShowDialog(true)}>
            <View className={styles.menuLeft}>
              <View className={`${styles.menuIcon}`} style={{ backgroundColor: 'var(--color-surface-container-highest)' }}>
                <Text>🧪</Text>
              </View>
              <Text className={styles.menuText}>组件预览</Text>
            </View>
            <Text style={{ color: 'var(--color-outline)', fontSize: '32px' }}>›</Text>
          </View>
        </View>

        {/* Editorial Quote Card */}
        <View className={styles.quoteCard}>
          <Text className={styles.quoteIcon}>“</Text>
          <Text className={styles.quoteText}>唯有爱与美食，不可辜负。</Text>
          <Text className={styles.quoteAuthor}>— 林氏家训 —</Text>
        </View>
      </View>

      <ConfirmDialog
        open={showDialog}
        title="确认要继续吗？"
        description="这是一个演示手账风格确认弹窗的交互。后续您可以基于此组件扩展更多业务逻辑。"
        onCancel={() => setShowDialog(false)}
        onConfirm={() => setShowDialog(false)}
      />
    </PageContainer>
  )
}
