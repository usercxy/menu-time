import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { EmptyState } from '@/components/base/EmptyState'
import { PageContainer } from '@/components/base/PageContainer'
import { queryClient } from '@/utils/query-client'
import { recipeService } from '@/services/modules/recipe'
import { redirectToRoute } from '@/utils/navigation'
import { routes } from '@/constants/routes'
import styles from './index.module.scss'

export default function VersionComparePage() {
  const router = useRouter()
  const recipeId = router.params.recipeId || ''
  const baseVersionId = router.params.base || ''
  const targetVersionId = router.params.target || ''
  const hasParams = Boolean(recipeId && baseVersionId && targetVersionId)

  const detailQuery = useQuery({
    queryKey: ['recipe-detail', recipeId],
    queryFn: () => recipeService.getRecipeDetail(recipeId),
    enabled: hasParams
  })
  const compareQuery = useQuery({
    queryKey: ['recipe-compare', recipeId, baseVersionId, targetVersionId],
    queryFn: () => recipeService.compareRecipeVersions(recipeId, baseVersionId, targetVersionId),
    enabled: hasParams
  })
  const baseVersionQuery = useQuery({
    queryKey: ['recipe-version-detail', recipeId, baseVersionId],
    queryFn: () => recipeService.getRecipeVersionDetail(recipeId, baseVersionId),
    enabled: hasParams
  })
  const targetVersionQuery = useQuery({
    queryKey: ['recipe-version-detail', recipeId, targetVersionId],
    queryFn: () => recipeService.getRecipeVersionDetail(recipeId, targetVersionId),
    enabled: hasParams
  })
  const versionsQuery = useQuery({
    queryKey: ['recipe-versions', recipeId],
    queryFn: () => recipeService.getRecipeVersions(recipeId),
    enabled: hasParams
  })

  const currentVersion = useMemo(
    () => versionsQuery.data?.find((version) => version.isCurrent) || null,
    [versionsQuery.data]
  )

  const setCurrentMutation = useMutation({
    mutationFn: () => recipeService.setCurrentRecipeVersion(recipeId, targetVersionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recipe-detail', recipeId] }),
        queryClient.invalidateQueries({ queryKey: ['recipe-versions', recipeId] }),
        queryClient.invalidateQueries({ queryKey: ['recipe-compare', recipeId] }),
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
      ])

      Taro.showToast({
        title: '已切换为当前版本',
        icon: 'success'
      })

      setTimeout(() => {
        void redirectToRoute(routes.recipeDetail, { id: recipeId, tab: 'versions' })
      }, 220)
    }
  })

  if (!hasParams) {
    return (
      <PageContainer title="版本对比" subtitle="缺少必要参数" showBack>
        <EmptyState title="无法开始对比" description="请从菜谱详情页的版本列表进入，系统需要知道基准版本和目标版本。" />
      </PageContainer>
    )
  }

  const recipeName = detailQuery.data?.name || '菜谱'
  const compare = compareQuery.data
  const baseVersion = baseVersionQuery.data
  const targetVersion = targetVersionQuery.data
  const isTargetCurrent = currentVersion?.id === targetVersionId

  return (
    <PageContainer title="版本对比" subtitle={`${recipeName} · 看看这次改了什么`} showBack>
      {compare && baseVersion && targetVersion ? (
        <View className="page-stack">
          <View className={styles.summaryCard}>
            <Text className={styles.summaryEyebrow}>差异摘要</Text>
            <Text className={styles.summaryText}>{compare.summaryText || '这两个版本差异较小。'}</Text>
            <View className={styles.summaryGrid}>
              <View className={styles.metricCard}>
                <Text className={styles.metricLabel}>主料调整</Text>
                <Text className={styles.metricValue}>
                  {compare.summaryJson?.ingredientsChanged ? '有变化' : '无变化'}
                </Text>
              </View>
              <View className={styles.metricCard}>
                <Text className={styles.metricLabel}>步骤数</Text>
                <Text className={styles.metricValue}>
                  {compare.summaryJson?.stepCountBefore || 0} → {compare.summaryJson?.stepCountAfter || 0}
                </Text>
              </View>
            </View>
            <View className={styles.tagSummary}>
              <Text className={styles.summaryMeta}>
                新增标签：{compare.summaryJson?.addedTags?.length ? compare.summaryJson.addedTags.join('、') : '无'}
              </Text>
              <Text className={styles.summaryMeta}>
                移除标签：{compare.summaryJson?.removedTags?.length ? compare.summaryJson.removedTags.join('、') : '无'}
              </Text>
            </View>
          </View>

          <View className={styles.compareHeader}>
            <View className={styles.versionBadgeCard}>
              <Text className={styles.versionSide}>基准版本</Text>
              <Text className={styles.versionName}>
                V{compare.baseVersion.versionNumber}
                {compare.baseVersion.versionName ? ` · ${compare.baseVersion.versionName}` : ''}
              </Text>
            </View>
            <View className={styles.versionBadgeCard}>
              <Text className={styles.versionSide}>目标版本</Text>
              <Text className={styles.versionName}>
                V{compare.targetVersion.versionNumber}
                {compare.targetVersion.versionName ? ` · ${compare.targetVersion.versionName}` : ''}
              </Text>
            </View>
          </View>

          <View className={styles.diffGrid}>
            <View className={styles.columnCard}>
              <Text className="section-title">基准版本内容</Text>
              <View className={styles.detailBlock}>
                <Text className={styles.blockTitle}>分类与标签</Text>
                <Text className={styles.blockBody}>
                  {baseVersion.category?.name || '未分类'}
                  {baseVersion.tags.length ? ` · ${baseVersion.tags.map((tag) => tag.name).join('、')}` : ''}
                </Text>
              </View>
              <View className={styles.detailBlock}>
                <Text className={styles.blockTitle}>主料</Text>
                {baseVersion.ingredients.map((item) => (
                  <Text className={styles.listItem} key={`base-ingredient-${item.rawText}`}>
                    {item.rawText}
                  </Text>
                ))}
              </View>
              <View className={styles.detailBlock}>
                <Text className={styles.blockTitle}>步骤</Text>
                {baseVersion.steps.map((step) => (
                  <Text className={styles.listItem} key={`base-step-${step.sortOrder}`}>
                    {step.sortOrder}. {step.content}
                  </Text>
                ))}
              </View>
              {baseVersion.tips ? (
                <View className={styles.detailBlock}>
                  <Text className={styles.blockTitle}>小贴士</Text>
                  <Text className={styles.blockBody}>{baseVersion.tips}</Text>
                </View>
              ) : null}
            </View>

            <View className={styles.columnCard}>
              <Text className="section-title">目标版本内容</Text>
              <View className={styles.detailBlock}>
                <Text className={styles.blockTitle}>分类与标签</Text>
                <Text className={styles.blockBody}>
                  {targetVersion.category?.name || '未分类'}
                  {targetVersion.tags.length ? ` · ${targetVersion.tags.map((tag) => tag.name).join('、')}` : ''}
                </Text>
              </View>
              <View className={styles.detailBlock}>
                <Text className={styles.blockTitle}>主料</Text>
                {targetVersion.ingredients.map((item) => (
                  <Text className={styles.listItem} key={`target-ingredient-${item.rawText}`}>
                    {item.rawText}
                  </Text>
                ))}
              </View>
              <View className={styles.detailBlock}>
                <Text className={styles.blockTitle}>步骤</Text>
                {targetVersion.steps.map((step) => (
                  <Text className={styles.listItem} key={`target-step-${step.sortOrder}`}>
                    {step.sortOrder}. {step.content}
                  </Text>
                ))}
              </View>
              {targetVersion.tips ? (
                <View className={styles.detailBlock}>
                  <Text className={styles.blockTitle}>小贴士</Text>
                  <Text className={styles.blockBody}>{targetVersion.tips}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className={styles.footerActions}>
            <View
              className="secondary-button"
              onClick={() => redirectToRoute(routes.versionCreate, { recipeId, sourceVersionId: targetVersionId })}
            >
              <Text>继续基于目标版本调整</Text>
            </View>
            <View
              className={`primary-button ${styles.primaryAction} ${
                isTargetCurrent || setCurrentMutation.isPending ? styles.primaryActionDisabled : ''
              }`}
              onClick={() => {
                if (!isTargetCurrent && !setCurrentMutation.isPending) {
                  void setCurrentMutation.mutateAsync()
                }
              }}
            >
              <Text>
                {isTargetCurrent
                  ? '该版本已是当前版本'
                  : setCurrentMutation.isPending
                    ? '切换中...'
                    : '设为当前版本'}
              </Text>
            </View>
          </View>
        </View>
      ) : detailQuery.isLoading || compareQuery.isLoading || baseVersionQuery.isLoading || targetVersionQuery.isLoading ? (
        <View className={styles.loadingCard}>
          <Text className={styles.summaryMeta}>正在整理两个版本的差异...</Text>
        </View>
      ) : (
        <EmptyState title="版本内容暂不可用" description="请返回详情页重新进入，或稍后再试。" />
      )}
    </PageContainer>
  )
}
