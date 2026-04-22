import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Image, Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import dayjs from 'dayjs'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { PageContainer } from '@/components/base/PageContainer'
import { EmptyState } from '@/components/base/EmptyState'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { routes } from '@/constants/routes'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { momentService } from '@/services/modules/moment'
import { recipeService } from '@/services/modules/recipe'
import { setMealPlanDraft } from '@/utils/meal-plan-draft'
import { getSafeImageUrl, isUsableImageUrl } from '@/utils/media-url'
import { queryClient } from '@/utils/query-client'
import { navigateToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

type DetailTab = 'method' | 'versions' | 'moments'
const DEFAULT_RECIPE_COVER_URL =
  'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80'

function normalizeTab(value?: string): DetailTab {
  if (value === 'versions' || value === 'moments') {
    return value
  }

  return 'method'
}

function renderRating(value: number, label: string) {
  return `${label} ${'★'.repeat(value)}${'☆'.repeat(Math.max(5 - value, 0))}`
}

export default function RecipeDetailPage() {
  const router = useRouter()
  const recipeId = router.params.id || 'recipe_braised_pork'
  const focusMomentId = router.params.momentId || ''
  const [activeTab, setActiveTab] = useState<DetailTab>(() => normalizeTab(router.params.tab))
  const [momentPage, setMomentPage] = useState(1)

  const detailQuery = useQuery({
    queryKey: ['recipe-detail', recipeId],
    queryFn: () => recipeService.getRecipeDetail(recipeId)
  })
  const versionsQuery = useQuery({
    queryKey: ['recipe-versions', recipeId],
    queryFn: () => recipeService.getRecipeVersions(recipeId),
    enabled: activeTab === 'versions'
  })
  const momentsQuery = useQuery({
    queryKey: ['recipe-moments', recipeId, momentPage],
    queryFn: () => momentService.getRecipeMoments(recipeId, { page: momentPage, pageSize: 5 }),
    enabled: activeTab === 'moments'
  })

  usePageShowRefetch([
    detailQuery,
    activeTab === 'versions' ? versionsQuery : null,
    activeTab === 'moments' ? momentsQuery : null
  ])

  const deleteMomentMutation = useMutation({
    mutationFn: (momentId: string) => momentService.deleteMoment(momentId)
  })

  const detail = detailQuery.data
  const currentVersion = detail?.currentVersion
  const versions = versionsQuery.data?.items || []
  const moments = momentsQuery.data?.items || []
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

  const handleDeleteMoment = async (momentId: string) => {
    const result = await Taro.showModal({
      title: '删除这条食光？',
      content: '删除后这条时光记录会从首页动态和菜谱时光轴中移除。',
      confirmText: '删除',
      confirmColor: '#ba1a1a'
    })

    if (!result.confirm) {
      return
    }

    await deleteMomentMutation.mutateAsync(momentId)

    if (moments.length === 1 && momentPage > 1) {
      setMomentPage((current) => Math.max(current - 1, 1))
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recipe-detail', recipeId] }),
      queryClient.invalidateQueries({ queryKey: ['recipe-moments', recipeId] }),
      queryClient.invalidateQueries({ queryKey: ['moments', 'latest'] }),
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
    ])

    Taro.showToast({
      title: '已删除记录',
      icon: 'success'
    })
  }

  const handleAddToPlanner = () => {
    if (!detail) {
      return
    }

    setMealPlanDraft({
      recipeId,
      recipeName: detail.name,
      recipeVersionId: currentVersion?.id,
      recipeVersionLabel: currentVersion
        ? `V${currentVersion.versionNumber}${currentVersion.versionName ? ` · ${currentVersion.versionName}` : ''}`
        : undefined,
      mealSlot: 'dinner'
    })

    void navigateToRoute(routes.mealPlanner)
  }

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
          <Image
            className={styles.heroImage}
            mode="aspectFill"
            src={getSafeImageUrl(detail.coverImageUrl, DEFAULT_RECIPE_COVER_URL)}
          />
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
            <View className={styles.actionIcon}>
              <SvgIcon className={styles.actionIconImage} name="bianji" size={20} color={svgIconColors.primary} />
              <Text>编辑</Text>
            </View>
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
            <View className={styles.actionIcon}>
              <SvgIcon className={styles.actionIconImage} name="jiahao" size={20} color={svgIconColors.primary} />
              <Text>新增</Text>
            </View>
          </View>
          <View className={styles.actionCard} onClick={handleAddToPlanner}>
            <View className={styles.actionMeta}>
              <Text className={styles.actionTitle}>加入点菜台</Text>
              <Text className={styles.actionSubtitle}>带着当前菜谱和版本跳去本周菜单，直接安排到某一天的某一餐。</Text>
            </View>
            <View className={styles.actionIcon}>
              <SvgIcon className={styles.actionIconImage} name="wenjian" size={20} color={svgIconColors.primary} />
              <Text>点菜</Text>
            </View>
          </View>
          <View
            className={styles.actionCard}
            onClick={() =>
              navigateToRoute(routes.momentEdit, {
                recipeId,
                versionId: currentVersion?.id
              })
            }
          >
            <View className={styles.actionMeta}>
              <Text className={styles.actionTitle}>记一笔</Text>
              <Text className={styles.actionSubtitle}>补一张照片、写下当天感受，食光就会回到首页和时光轴。</Text>
            </View>
            <View className={styles.actionIcon}>
              <SvgIcon className={styles.actionIconImage} name="shijian" size={20} color={svgIconColors.primary} />
              <Text>记录</Text>
            </View>
          </View>
        </View>

        <View className={styles.tabBar}>
          {tabs.map((tab) => (
            <View
              className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                if (tab.key === 'moments') {
                  setMomentPage(1)
                }
              }}
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
                        <SvgIcon
                          className={styles.compareIconImage}
                          name="chakan"
                          size={20}
                          color={svgIconColors.primary}
                        />
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
          momentsQuery.isLoading ? (
            <LoadingState title="正在翻出食光记录" description="照片和评价正在按时间顺序摆到桌面上。" />
          ) : momentsQuery.isError ? (
            <ErrorState
              title="时光轴暂时没取到"
              description="可以重新加载一次，或者先去记一笔补一条新的记录。"
              onAction={() => void momentsQuery.refetch()}
            />
          ) : !moments.length ? (
            <EmptyState
              title="这道菜还没有食光记录"
              description="先去记下一次开火的心情、评分和照片，这里就会长成一条时间线。"
              actionText="现在记一笔"
              onAction={() =>
                navigateToRoute(routes.momentEdit, {
                  recipeId,
                  versionId: currentVersion?.id
                })
              }
            />
          ) : (
            <View className="page-stack">
              {moments.map((moment) => (
                <View
                  className={`${styles.momentCard} ${focusMomentId === moment.id ? styles.momentCardFocused : ''}`}
                  key={moment.id}
                >
                  <View className={styles.momentHeader}>
                    <View className={styles.momentMeta}>
                      <Text className={styles.momentDate}>{dayjs(moment.occurredOn).format('YYYY 年 M 月 D 日')}</Text>
                      <Text className={styles.momentVersion}>
                        {moment.recipeVersion
                          ? `来自 V${moment.recipeVersion.versionNumber}${moment.recipeVersion.versionName ? ` · ${moment.recipeVersion.versionName}` : ''}`
                          : '未记录版本'}
                      </Text>
                    </View>
                    <View className={styles.momentActions}>
                      <View
                        className={styles.momentAction}
                        onClick={() =>
                          navigateToRoute(routes.momentEdit, {
                            recipeId,
                            momentId: moment.id,
                            versionId: moment.recipeVersion?.id
                          })
                        }
                      >
                        <Text>编辑</Text>
                      </View>
                      <View className={styles.momentActionDanger} onClick={() => void handleDeleteMoment(moment.id)}>
                        <Text>删除</Text>
                      </View>
                    </View>
                  </View>

                  <Text className={styles.momentContent}>{moment.content}</Text>

                  {moment.images.length ? (
                    <View className={styles.momentImageGrid}>
                      {moment.images.map((image) => (
                        <Image
                          className={styles.momentImage}
                          key={image.id}
                          mode="aspectFill"
                          src={getSafeImageUrl(image.assetUrl, DEFAULT_RECIPE_COVER_URL)}
                          onClick={() =>
                            isUsableImageUrl(image.assetUrl)
                              ? Taro.previewImage({
                                  current: image.assetUrl,
                                  urls: moment.images.map((item) => item.assetUrl).filter(isUsableImageUrl)
                                })
                              : undefined
                          }
                        />
                      ))}
                    </View>
                  ) : null}

                  <View className={styles.momentStats}>
                    <View className={styles.momentStatChip}>
                      <Text>{renderRating(moment.tasteRating, '风味')}</Text>
                    </View>
                    <View className={styles.momentStatChip}>
                      <Text>{renderRating(moment.difficultyRating, '难度')}</Text>
                    </View>
                    {moment.participantsText ? (
                      <View className={styles.momentStatChipSoft}>
                        <Text>一起吃饭：{moment.participantsText}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}

              <View className={styles.paginationRow}>
                <View
                  className={`${styles.pageAction} ${momentPage <= 1 ? styles.pageActionDisabled : ''}`}
                  onClick={() => momentPage > 1 && setMomentPage((current) => current - 1)}
                >
                  <Text>上一页</Text>
                </View>
                <Text className={styles.pageLabel}>
                  第 {momentsQuery.data?.page || 1} 页 / 共 {Math.max(Math.ceil((momentsQuery.data?.total || 0) / (momentsQuery.data?.pageSize || 5)), 1)} 页
                </Text>
                <View
                  className={`${styles.pageAction} ${!momentsQuery.data?.hasMore ? styles.pageActionDisabled : ''}`}
                  onClick={() => momentsQuery.data?.hasMore && setMomentPage((current) => current + 1)}
                >
                  <Text>下一页</Text>
                </View>
              </View>
            </View>
          )
        ) : null}
      </View>
    </PageContainer>
  )
}
