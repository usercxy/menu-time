import { Image, Text, View } from '@tarojs/components'
import type { RecipeListItemDTO } from '@/services/types/recipe'
import styles from './index.module.scss'

interface RecipeCardProps {
  recipe: RecipeListItemDTO
  viewMode: 'list' | 'grid'
  onClick?: () => void
}

export function RecipeCard({ recipe, viewMode, onClick }: RecipeCardProps) {
  const rootClassName = `${styles.root} ${viewMode === 'grid' ? styles.rootGrid : styles.rootList}`
  const coverClassName = `${styles.cover} ${viewMode === 'grid' ? styles.coverGrid : styles.coverList}`
  const currentVersionLabel = recipe.currentVersion
    ? `V${recipe.currentVersion.versionNumber}${recipe.currentVersion.versionName ? ` · ${recipe.currentVersion.versionName}` : ''}`
    : '暂无版本'

  return (
    <View className={rootClassName} onClick={onClick}>
      <View className={coverClassName}>
        <Image className={styles.coverImage} mode="aspectFill" src={recipe.coverImageUrl || ''} />
        <View className={styles.versionBadge}>
          <Text>{currentVersionLabel}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.title}>{recipe.name}</Text>
          <View className={styles.momentBadge}>
            <Text>{recipe.momentCount} 条食光</Text>
          </View>
        </View>

        <View className={styles.metaStack}>
          <Text className={styles.metaText}>📂 {recipe.currentVersion?.category?.name || '未分类'}</Text>
          <Text className={styles.metaText}>
            🏷️{' '}
            {recipe.currentVersion?.tags.length
              ? recipe.currentVersion.tags.map((tag) => tag.name).join(' / ')
              : '暂无标签'}
          </Text>
          <Text className={styles.metaText}>🕰️ {recipe.latestCookedAt || '还没有烹饪记录'}</Text>
        </View>
      </View>
    </View>
  )
}
