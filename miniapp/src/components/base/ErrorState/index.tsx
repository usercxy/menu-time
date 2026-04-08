import { Text, View } from '@tarojs/components'
import styles from './index.module.scss'

interface ErrorStateProps {
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export function ErrorState({
  title = '加载失败',
  description = '这次没拿到数据，可以稍后再试一次。',
  actionText = '重新加载',
  onAction
}: ErrorStateProps) {
  return (
    <View className={styles.root}>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.description}>{description}</Text>
      {onAction ? (
        <View className={styles.action} onClick={onAction}>
          <Text>{actionText}</Text>
        </View>
      ) : null}
    </View>
  )
}
