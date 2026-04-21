import type { PropsWithChildren, ReactNode } from 'react'
import { useMemo } from 'react'
import Taro from '@tarojs/taro'
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
  const { statusBarHeight, navBarHeight } = useMemo(() => {
    const sysInfo = Taro.getSystemInfoSync()
    const sHeight = sysInfo.statusBarHeight || 20
    
    let nHeight = 44
    try {
      const rect = Taro.getMenuButtonBoundingClientRect()
      nHeight = (rect.top - sHeight) * 2 + rect.height
    } catch (e) {
      nHeight = 44
    }
    
    return { statusBarHeight: sHeight, navBarHeight: nHeight }
  }, [])

  const totalNavHeight = statusBarHeight + navBarHeight

  return (
    <View className={`app-shell ${styles.root}`}>
      <TopNavBar
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        rightAction={rightAction}
        statusBarHeight={statusBarHeight}
        navBarHeight={navBarHeight}
      />
      <View className={`page-shell ${styles.body}`} style={{ paddingTop: `${totalNavHeight + 32}px` }}>
        {children}
      </View>
    </View>
  )
}
