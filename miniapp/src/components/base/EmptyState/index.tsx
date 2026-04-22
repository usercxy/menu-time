import { Text, View } from '@tarojs/components'
import styles from './index.module.scss'

interface EmptyStateProps {
  title: string
  description: string
  actionText?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <View className={styles.root}>
      <Text className={styles.title}>{title}</Text>
      <Text className={styles.description}>{description}</Text>
      {actionText && onAction ? (
        <View className={styles.action} onClick={onAction}>
          <Text>{actionText}</Text>
        </View>
      ) : null}
    </View>
  )
}
