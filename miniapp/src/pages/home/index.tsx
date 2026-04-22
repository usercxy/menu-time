import { useMemo } from 'react'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { Image, Text, View } from '@tarojs/components'
import dayjs from 'dayjs'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { routes } from '@/constants/routes'
import { PageContainer } from '@/components/base/PageContainer'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { useSessionQuery } from '@/features/auth/query'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { mealPlanService } from '@/services/modules/meal-plan'
import { momentService } from '@/services/modules/moment'
import { useSessionStore } from '@/store/session'
import { getSafeImageUrl } from '@/utils/media-url'
import { navigateToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

const EMPTY_MOMENTS: Awaited<ReturnType<typeof momentService.getLatestMoments>>['items'] = []
const DEFAULT_MEMORY_COVER_URL =
  'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80'

export default function HomePage() {
  const sessionStatus = useSessionStore((state) => state.status)
  const sessionQuery = useSessionQuery()
  const sessionReady = sessionStatus === 'authenticated'
  
  const weekQuery = useQuery({
    queryKey: ['meal-plan', 'current-week'],
    queryFn: mealPlanService.getCurrentWeekPlan,
    enabled: sessionReady
  })
  
  const latestMomentsQuery = useQuery({
    queryKey: ['moments', 'latest'],
    queryFn: () => momentService.getLatestMoments({ limit: 3 }),
    enabled: sessionReady
  })

  usePageShowRefetch([sessionQuery, weekQuery, latestMomentsQuery])

  const weekSummary = weekQuery.data?.summary
  const latestMoments = latestMomentsQuery.data?.items ?? EMPTY_MOMENTS

  const cardStyles = useMemo(() => {
    return latestMoments.map((_, i) => ({
      transform: `rotate(${i % 2 === 0 ? (Math.random() * -2 - 0.5) : (Math.random() * 2 + 0.5)}deg)`,
      marginLeft: i % 2 === 0 ? '0' : '32px',
      marginRight: i % 2 === 0 ? '32px' : '0'
    }))
  }, [latestMoments])

  if (sessionStatus === 'anonymous') {
    return (
      <PageContainer title="食光记" subtitle="正在确认登录状态">
        <View className="page-stack">
          <ErrorState
            title="登录状态暂不可用"
            description="请退出后重新进入小程序，确认登录完成后再加载首页内容。"
            onAction={() => void sessionQuery.refetch()}
          />
        </View>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="食光记" subtitle={`欢迎回来，${sessionQuery.data?.nickname || '主厨'}`}>
      <View className="page-stack">
        {/* Hero Section */}
        {!sessionReady || weekQuery.isLoading ? (
          <LoadingState title="正在准备首页" description="本周计划正在装盘，马上就好。" />
        ) : weekQuery.isError ? (
          <ErrorState
            title="本周计划加载失败"
            description="这次没连上菜单计划，稍后重试或先去菜谱库看看。"
            onAction={() => void weekQuery.refetch()}
          />
        ) : (
          <View className={styles.heroCard} onClick={() => navigateToRoute(routes.mealPlanner)}>
            <View className={styles.heroContent}>
              <Text className="eyebrow">本周计划</Text>
              <Text className="editorial-title">
                已安排 {weekSummary?.completedMeals || 0} 顿餐食
              </Text>
              <Text className="muted-text" style={{ fontSize: '24px' }}>
                {weekSummary?.summary || '快去开启本周的美味旅程吧'}
              </Text>
            </View>
            <View className={styles.heroIcon}>
              <SvgIcon
                className={styles.heroIconImage}
                name="shijian"
                size={40}
                color={svgIconColors.onPrimary}
              />
            </View>
            <View className={styles.heroBackground}>
              <SvgIcon
                className={styles.heroBackgroundIcon}
                name="shijian"
                size={200}
                color={svgIconColors.primary}
              />
            </View>
          </View>
        )}

        {/* Section Header */}
        <View className={styles.sectionHeader}>
          <Text className="section-title">时光锦囊</Text>
          <View className={styles.sectionLink} onClick={() => navigateToRoute(routes.recipeLibrary)}>
            <Text className="inline-link">查看全部</Text>
            <SvgIcon
              className={styles.sectionLinkIcon}
              name="youjiantou"
              size={24}
              color={svgIconColors.onSurfaceVariant}
            />
          </View>
        </View>

        {/* Memory Feed */}
        {!sessionReady || latestMomentsQuery.isLoading ? (
          <LoadingState title="正在翻开菜谱记忆" description="最近的时光记录正在赶来首页。" />
        ) : latestMomentsQuery.isError ? (
          <ErrorState
            title="时光流加载失败"
            description="这次没取到最新食光，你可以稍后重试，或者先去菜谱库查看全部。"
            onAction={() => void latestMomentsQuery.refetch()}
          />
        ) : !latestMoments.length ? (
          <ErrorState
            title="还没有最新食光"
            description="去菜谱详情记下一笔，首页就会把新的回忆钉在这里。"
            actionText="去菜谱库"
            onAction={() => navigateToRoute(routes.recipeLibrary)}
          />
        ) : (
          <View className={styles.memoryGrid}>
            {latestMoments.map((moment, index) => (
              <View
                className={styles.memoryCard}
                key={moment.momentId}
                onClick={() =>
                  navigateToRoute(routes.recipeDetail, {
                    id: moment.recipeId,
                    tab: 'moments',
                    momentId: moment.momentId
                  })
                }
                style={cardStyles[index]}
              >
                <View className={styles.memoryImageWrap}>
                  <Image
                    className="recipe-cover"
                    mode="aspectFill"
                    src={getSafeImageUrl(moment.coverImageUrl, DEFAULT_MEMORY_COVER_URL)}
                    style={{ height: index % 2 === 0 ? '480px' : '400px' }}
                  />
                  <View
                    className={styles.memoryDateBadge}
                    style={{ transform: index % 2 === 0 ? 'rotate(1.2deg)' : 'rotate(-3deg)' }}
                  >
                    <Text className={styles.memoryDateText}>
                      {dayjs(moment.occurredOn).format('YYYY.MM.DD')}
                    </Text>
                  </View>
                </View>

                <View className={styles.memoryBody}>
                  <View className={styles.memoryTitleRow}>
                    <View className={styles.memoryLine} />
                    <Text className="recipe-name" style={{ fontSize: '36px' }}>
                      {moment.recipeName}
                    </Text>
                  </View>

                  <Text className={styles.memoryNote}>“{moment.previewText || '这道菜的味道，值得被时光铭记。'}”</Text>

                  <View className={styles.memoryFooter}>
                    <View className="chip">
                      <Text>#{dayjs(moment.occurredOn).format('M 月 D 日')}</Text>
                    </View>
                    <View className="chip chip--soft">
                      <Text>点击查看时光轴</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {/* Floating Action Button */}
      <View className={styles.fab} onClick={() => navigateToRoute(routes.recipeEdit)}>
        <SvgIcon className={styles.fabIcon} name="jiahao" size={22} color={svgIconColors.onPrimary} />
        <Text>新建</Text>
      </View>
    </PageContainer>
  )
}
