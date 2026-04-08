import { Text, View } from '@tarojs/components'
import styles from './index.module.scss'

interface LoadingStateProps {
  title?: string
  description?: string
}

export function LoadingState({
  title = '正在加载',
  description = '先别着急，内容正在慢慢装盘。'
}: LoadingStateProps) {
  return (
    <View className={styles.root}>
      <View className={styles.dotRow}>
        <View className={styles.dot} />
        <View className={styles.dot} />
        <View className={styles.dot} />
      </View>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.description}>{description}</Text>
    </View>
  )
}
