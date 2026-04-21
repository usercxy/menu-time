import type { ReactNode } from 'react'
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
  return (
    <View className={styles.bar}>
      <View className={styles.inner}>
        <View className={styles.left}>
          {showBack ? (
            <View className={styles.back} onClick={() => navigateBackOrHome()}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </View>
          ) : (
            <View className={styles.back}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8H20M4 16H20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
