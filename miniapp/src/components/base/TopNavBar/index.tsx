import type { ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { navigateBackOrHome } from '@/utils/navigation'
import styles from './index.module.scss'

interface TopNavBarProps {
  title: string
  subtitle?: string
  showBack?: boolean
  rightAction?: ReactNode
}

export function TopNavBar({ title, subtitle, showBack, rightAction }: TopNavBarProps) {
  const statusBarHeight = Taro.getSystemInfoSync().statusBarHeight || 24

  return (
    <View className={styles.bar} style={{ paddingTop: `${statusBarHeight}px` }}>
      <View className={styles.inner}>
        <View className={styles.left}>
          {showBack ? (
            <View className={styles.back} onClick={() => navigateBackOrHome()}>
              <Text className={styles.icon}>‹</Text>
            </View>
          ) : (
            <View className={styles.back}>
              <Text className={styles.icon}>≡</Text>
            </View>
          )}
          <View className={styles.titleWrap}>
            <Text className={styles.title}>{title}</Text>
            {subtitle ? <Text className={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        <View className={styles.right}>
          {rightAction || (
            <View className={styles.actionIcon}>
              <Text>+</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
