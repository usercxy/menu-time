import type { ReactNode } from 'react'
import { Text, View } from '@tarojs/components'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { navigateBackOrHome } from '@/utils/navigation'
import styles from './index.module.scss'

interface TopNavBarProps {
  title: string
  subtitle?: string
  showBack?: boolean
  rightAction?: ReactNode
  statusBarHeight: number
  navBarHeight: number
}

function getLeadingIconName(title: string) {
  if (title === '菜谱库') {
    return 'wenjian' as const
  }

  if (title === '点菜台') {
    return 'liebiao' as const
  }

  if (title === '我的') {
    return 'yonghu' as const
  }

  return 'shijian' as const
}

export function TopNavBar({
  title,
  subtitle,
  showBack,
  rightAction,
  statusBarHeight,
  navBarHeight
}: TopNavBarProps) {
  const leadingIconName = getLeadingIconName(title)

  return (
    <View className={styles.bar} style={{ paddingTop: `${statusBarHeight}px` }}>
      <View className={styles.inner} style={{ height: `${navBarHeight}px` }}>
        <View className={styles.left}>
          {showBack ? (
            <View className={styles.back} onClick={() => navigateBackOrHome()}>
              <SvgIcon name="zuojiantou" size={24} color={svgIconColors.primary} />
            </View>
          ) : (
            <View className={styles.leadingIcon}>
              <SvgIcon name={leadingIconName} size={26} color={svgIconColors.primary} />
            </View>
          )}
          <View className={styles.titleWrap}>
            <Text className={styles.title}>{title}</Text>
            {subtitle ? <Text className={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {rightAction ? <View className={styles.right}>{rightAction}</View> : null}
      </View>
    </View>
  )
}
