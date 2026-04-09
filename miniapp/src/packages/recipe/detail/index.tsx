import { useMemo, useState } from 'react'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { Image, Text, View } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { EmptyState } from '@/components/base/EmptyState'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { PageContainer } from '@/components/base/PageContainer'
import { routes } from '@/constants/routes'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { recipeService } from '@/services/modules/recipe'
import { navigateToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

type DetailTab = 'method' | 'versions' | 'moments'

function normalizeTab(value?: string): DetailTab {
  if (value === 'versions' || value === 'moments') {
    return value
  }

  return 'method'
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const recipeId = router.params.id || 'recipe_braised_pork'
  const [activeTab, setActiveTab] = useState<DetailTab>(() => normalizeTab(router.params.tab))

  const detailQuery = useQuery({
    queryKey: ['recipe-detail', recipeId],
    queryFn: () => recipeService.getRecipeDetail(recipeId)
  })
  const versionsQuery = useQuery({
    queryKey: ['recipe-versions', recipeId],
    queryFn: () => recipeService.getRecipeVersions(recipeId),
    enabled: activeTab === 'versions'
  })

  usePageShowRefetch([detailQuery, activeTab === 'versions' ? versionsQuery : null])

  const detail = detailQuery.data
  const currentVersion = detail?.currentVersion
  const versions = versionsQuery.data?.items || []
  const currentVersionLabel = currentVersion
    ? `V${currentVersion.versionNumber}${currentVersion.versionName ? ` · ${currentVersion.versionName}` : ''}`
    : '当前版本'

  const tabs = useMemo(
    () => [
      { key: 'method' as const, label: '做法' },
      { key: 'versions' as const, label: '版本' },
      { key: 'moments' as const, label: '时光轴' }
    ],
    []
  )

  if (detailQuery.isLoading) {
    return (
      <PageContainer title="菜谱详情" subtitle="正在读取菜谱档案" showBack>
        <LoadingState title="菜谱正在装盘" description="先把基础信息摆上桌，马上就能看到完整内容。" />
      </PageContainer>
    )
  }

  if (!detail || detailQuery.isError) {
    return (
      <PageContainer title="菜谱详情" subtitle="暂时无法读取内容" showBack>
        <ErrorState
          title="菜谱详情没取到"
          description="可以返回菜谱库重新进入，或稍后再试。"
          onAction={() => void detailQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer title={detail.name} subtitle="把这道菜的版本和回忆整理成册" showBack>
      <View className="page-stack">
        <View className={styles.heroCard}>
          <Image className={styles.heroImage} mode="aspectFill" src={detail.coverImageUrl || ''} />
          <View className={styles.heroOverlay}>
            <Text className="eyebrow">Recipe Archive</Text>
            <Text className={styles.heroTitle}>{detail.name}</Text>
            <Text className={styles.heroDescription}>
              {currentVersion?.diffSummaryText || detail.slug || '把这道菜的版本和回忆整理成册。'}
            </Text>
            <View className={styles.heroMetaWrap}>
              <View className={styles.heroPill}>
                <Text>{currentVersionLabel}</Text>
              </View>
              {currentVersion?.category ? (
                <View className={styles.heroPillSoft}>
                  <Text>{currentVersion.category.name}</Text>
                </View>
              ) : null}
              {(currentVersion?.tags || []).map((tag) => (
                <View className={styles.heroPillSoft} key={tag.id}>
                  <Text>#{tag.name}</Text>
                </View>
              ))}
            </View>
            <View className={styles.statRow}>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{detail.versionCount}</Text>
                <Text className={styles.statLabel}>版本存档</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{detail.momentCount}</Text>
                <Text className={styles.statLabel}>食光记录</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{currentVersion?.steps.length || 0}</Text>
                <Text className={styles.statLabel}>做法步骤</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.actionGrid}>
          <View className={styles.actionCard} onClick={() => navigateToRoute(routes.recipeEdit, { id: recipeId })}>
            <View className={styles.actionMeta}>
              <Text className={styles.actionTitle}>编辑基础信息</Text>
              <Text className={styles.actionSubtitle}>更新菜名等基础档案，不改历史版本。</Text>
            </View>
            <Text className={styles.inlineLink}>前往</Text>
          </View>
          <View
            className={styles.actionCard}
            onClick={() =>
              currentVersion
                ? navigateToRoute(routes.versionCreate, {
                    recipeId,
                    sourceVersionId: currentVersion.id
                  })
                : undefined
            }
          >
            <View className={styles.actionMeta}>
              <Text className={styles.actionTitle}>写新版本</Text>
              <Text className={styles.actionSubtitle}>基于当前版本继续调整，让味道慢慢靠近记忆。</Text>
            </View>
            <Text className={styles.inlineLink}>前往</Text>
          </View>
          <View className={styles.actionCard} onClick={() => navigateToRoute(routes.momentEdit, { recipeId })}>
            <View className={styles.actionMeta}>
              <Text className={styles.actionTitle}>记一笔</Text>
              <Text className={styles.actionSubtitle}>时光轴已预留位置，下一阶段补图片和评分。</Text>
            </View>
            <Text className={styles.inlineLink}>前往</Text>
          </View>
        </View>

        <View className={styles.tabBar}>
          {tabs.map((tab) => (
            <View
              className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>

        {activeTab === 'method' ? (
          <View className="page-stack">
            <View className={styles.sectionCard}>
              <View className={styles.sectionHeader}>
                <Text className="section-title">主料食材</Text>
                <Text className={styles.sectionHint}>当前展示的是当前版本的食材拆解。</Text>
              </View>
              <View className={styles.stackList}>
                {(currentVersion?.ingredients || []).map((ingredient) => (
                  <View className={styles.slotCard} key={ingredient.rawText}>
                    <Text className={styles.slotTitle}>{ingredient.normalizedName || ingredient.rawText}</Text>
                    <Text className={styles.slotSubtitle}>{ingredient.rawText}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.sectionCard}>
              <View className={styles.sectionHeader}>
                <Text className="section-title">做法步骤</Text>
                <Text className={styles.sectionHint}>步骤顺序跟随当前版本内容。</Text>
              </View>
              <View className={styles.stackList}>
                {(currentVersion?.steps || []).map((step) => (
                  <View className={styles.stepCard} key={step.sortOrder}>
                    <View className={styles.stepIndex}>
                      <Text>{step.sortOrder}</Text>
                    </View>
                    <Text className={styles.stepContent}>{step.content}</Text>
                  </View>
                ))}
              </View>
            </View>

            {currentVersion?.tips ? (
              <View className={styles.sectionCard}>
                <Text className="section-title">小贴士</Text>
                <Text className={styles.tipText}>{currentVersion.tips}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'versions' ? (
          versionsQuery.isLoading ? (
            <LoadingState title="版本轨迹整理中" description="正在把历史版本一张张翻出来。" />
          ) : versionsQuery.isError ? (
            <ErrorState
              title="版本列表暂时没取到"
              description="可以重新加载一次，再继续查看差异。"
              onAction={() => void versionsQuery.refetch()}
            />
          ) : (
            <View className={styles.sectionCard}>
              <View className={styles.sectionHeader}>
                <Text className="section-title">版本轨迹</Text>
                <Text className={styles.sectionHint}>当前版本会直接展示，历史版本可以一键发起对比。</Text>
              </View>
              <View className={styles.stackList}>
                {versions.map((version) => (
                  <View className={styles.versionRow} key={version.id}>
                    <View className={styles.versionMeta}>
                      <Text className={styles.slotTitle}>
                        V{version.versionNumber}
                        {version.versionName ? ` · ${version.versionName}` : ''}
                      </Text>
                      <Text className={styles.slotSubtitle}>
                        {version.isCurrent
                          ? '当前版本，详情页内容正在显示这一版。'
                          : version.diffSummaryText || '可以与当前版本查看差异摘要。'}
                      </Text>
                    </View>
                    {version.isCurrent ? (
                      <View className={styles.currentBadge}>
                        <Text>当前</Text>
                      </View>
                    ) : (
                      <View
                        className={styles.compareAction}
                        onClick={() =>
                          navigateToRoute(routes.versionCompare, {
                            recipeId,
                            base: String(version.versionNumber),
                            target: String(currentVersion?.versionNumber || 0)
                          })
                        }
                      >
                        <Text>对比</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )
        ) : null}

        {activeTab === 'moments' ? (
          <EmptyState
            title="时光轴下一阶段补齐"
            description="三 Tab 骨架已经就位，后续会在这里接入时光记录列表、图片和定位跳转。"
          />
        ) : null}
      </View>
    </PageContainer>
  )
}
