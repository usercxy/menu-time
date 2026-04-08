import type { PropsWithChildren, ReactNode } from 'react'
import { View } from '@tarojs/components'
import { TopNavBar } from '@/components/base/TopNavBar'
import styles from './index.module.scss'

interface PageContainerProps extends PropsWithChildren {
  title: string
  subtitle?: string
  showBack?: boolean
  rightAction?: ReactNode
}

export function PageContainer({
  title,
  subtitle,
  showBack,
  rightAction,
  children
}: PageContainerProps) {
  return (
    <View className={`app-shell ${styles.root}`}>
      <TopNavBar title={title} subtitle={subtitle} showBack={showBack} rightAction={rightAction} />
      <View className={`page-shell ${styles.body}`}>{children}</View>
    </View>
  )
}
