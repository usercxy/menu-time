import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { routes } from '@/constants/routes'
import { envConfig } from '@/constants/env'
import { ConfirmDialog } from '@/components/base/ConfirmDialog'
import { PageContainer } from '@/components/base/PageContainer'
import { useSessionQuery } from '@/features/auth/query'
import { navigateToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

export default function MyPage() {
  const [showDialog, setShowDialog] = useState(false)
  const sessionQuery = useSessionQuery()
  const session = sessionQuery.data
  const displayName = session?.nickname || '食光主厨'
  const roleLabel = session?.role === 'admin' ? '管理员' : '成员'

  return (
    <PageContainer title="我的" subtitle="管理家庭记忆与设置">
      <View className="page-stack">
        {/* Profile Header */}
        <View className={styles.profileHeader}>
          <View className={styles.avatarWrap}>
            <View className={styles.avatar}>
              <SvgIcon
                className={styles.avatarIcon}
                name="yonghu"
                size={52}
                color={svgIconColors.primary}
              />
            </View>
            <View className={styles.roleBadge}>
              <Text>{roleLabel}</Text>
            </View>
          </View>
          <View className={styles.profileMeta}>
            <Text className={styles.nickName}>{displayName}</Text>
            <Text className={styles.motto}>传承家味，留存食光</Text>
            <View className={styles.familyBadge}>
              <SvgIcon
                className={styles.familyBadgeIcon}
                name="yonghu"
                size={26}
                color={svgIconColors.onSecondaryContainer}
              />
              <Text>{session?.householdName || '家庭空间'}</Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.infoTitle}>数据概览准备中</Text>
          <Text className={styles.infoDescription}>
            菜谱、时光记录和版本统计会在后续接入真实统计接口后展示；当前先保留核心管理入口。
          </Text>
        </View>

        {/* Menu Section */}
        <View className={styles.menuGroup}>
          <View className={styles.menuItem} hoverClass={styles.menuItemHover} onClick={() => navigateToRoute(routes.categoryManage)}>
            <View className={styles.menuLeft}>
              <View className={`${styles.menuIcon} ${styles.menuIconTertiary}`}>
                <SvgIcon
                  className={styles.menuIconImage}
                  name="wenjian"
                  size={36}
                  color={svgIconColors.onTertiaryContainer}
                />
              </View>
              <Text className={styles.menuText}>分类管理</Text>
            </View>
            <SvgIcon
              className={styles.menuArrowIcon}
              name="youjiantou"
              size={28}
              color={svgIconColors.onSurfaceVariant}
            />
          </View>
          <View className={styles.divider} />
          <View className={styles.menuItem} hoverClass={styles.menuItemHover} onClick={() => navigateToRoute(routes.tagManage)}>
            <View className={styles.menuLeft}>
              <View className={`${styles.menuIcon} ${styles.menuIconTertiary}`}>
                <SvgIcon
                  className={styles.menuIconImage}
                  name="xingbiao"
                  size={36}
                  color={svgIconColors.onTertiaryContainer}
                />
              </View>
              <Text className={styles.menuText}>标签体系</Text>
            </View>
            <SvgIcon
              className={styles.menuArrowIcon}
              name="youjiantou"
              size={28}
              color={svgIconColors.onSurfaceVariant}
            />
          </View>
        </View>

        <View className={styles.menuGroup}>
          <View className={`${styles.menuItem} ${styles.menuItemDisabled}`}>
            <View className={styles.menuLeft}>
              <View className={`${styles.menuIcon} ${styles.menuIconSecondary}`}>
                <SvgIcon
                  className={styles.menuIconImage}
                  name="yonghu"
                  size={36}
                  color={svgIconColors.onSecondaryContainer}
                />
              </View>
              <View className={styles.menuCopy}>
                <Text className={styles.menuText}>家族协作</Text>
                <Text className={styles.menuHint}>多人协作能力即将开放</Text>
              </View>
            </View>
            <View className={styles.menuTail}>
              <View className={styles.planBadge}>即将开放</View>
            </View>
          </View>
        </View>

        <View className={styles.menuGroup}>
          <View className={styles.menuItem} hoverClass={styles.menuItemHover} onClick={() => navigateToRoute(routes.settings)}>
            <View className={styles.menuLeft}>
              <View className={`${styles.menuIcon} ${styles.menuIconSurface}`}>
                <SvgIcon
                  className={styles.menuIconImage}
                  name="shezhi"
                  size={36}
                  color={svgIconColors.primaryDeep}
                />
              </View>
              <Text className={styles.menuText}>系统设置</Text>
            </View>
            <SvgIcon
              className={styles.menuArrowIcon}
              name="youjiantou"
              size={28}
              color={svgIconColors.onSurfaceVariant}
            />
          </View>
          {envConfig.isDev ? (
            <>
              <View className={styles.divider} />
              <View className={styles.menuItem} hoverClass={styles.menuItemHover} onClick={() => setShowDialog(true)}>
                <View className={styles.menuLeft}>
                  <View className={`${styles.menuIcon} ${styles.menuIconSurface}`}>
                    <SvgIcon
                      className={styles.menuIconImage}
                      name="chakan"
                      size={36}
                      color={svgIconColors.primaryDeep}
                    />
                  </View>
                  <Text className={styles.menuText}>组件预览</Text>
                </View>
                <SvgIcon
                  className={styles.menuArrowIcon}
                  name="youjiantou"
                  size={28}
                  color={svgIconColors.onSurfaceVariant}
                />
              </View>
            </>
          ) : null}
        </View>

        {/* Editorial Quote Card */}
        <View className={styles.quoteCard}>
          <Text className={styles.quoteIcon}>“</Text>
          <Text className={styles.quoteText}>唯有爱与美食，不可辜负。</Text>
          <Text className={styles.quoteAuthor}>— 食光记 —</Text>
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
