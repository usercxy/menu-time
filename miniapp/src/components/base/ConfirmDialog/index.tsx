import { Text, View } from '@tarojs/components'
import styles from './index.module.scss'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <View className={styles.overlay} onClick={onCancel}>
      <View className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <Text className={styles.title}>{title}</Text>
        <Text className={styles.description}>{description}</Text>
        <View className={styles.actions}>
          <View className={`${styles.action} secondary-button`} onClick={onCancel}>
            <Text>{cancelText}</Text>
          </View>
          <View className={`${styles.action} primary-button`} onClick={onConfirm}>
            <Text>{confirmText}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
