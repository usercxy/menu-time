import { useMemo } from 'react'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { Image, Text, View } from '@tarojs/components'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { routes } from '@/constants/routes'
import { PageContainer } from '@/components/base/PageContainer'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { useSessionQuery } from '@/features/auth/query'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { mealPlanService } from '@/services/modules/meal-plan'
import { recipeService } from '@/services/modules/recipe'
import { useSessionStore } from '@/store/session'
import { navigateToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

const EMPTY_RECIPES: Awaited<ReturnType<typeof recipeService.getRecipes>>['items'] = []

export default function HomePage() {
  const sessionStatus = useSessionStore((state) => state.status)
  const sessionQuery = useSessionQuery()
  const sessionReady = sessionStatus === 'authenticated'
  
  const weekQuery = useQuery({
    queryKey: ['meal-plan', 'current-week'],
    queryFn: mealPlanService.getCurrentWeekPlan,
    enabled: sessionReady
  })
  
  const latestRecipesQuery = useQuery({
    queryKey: ['recipes', 'home-latest'],
    queryFn: () => recipeService.getRecipes({ page: 1, pageSize: 2 }),
    enabled: sessionReady
  })

  usePageShowRefetch([sessionQuery, weekQuery, latestRecipesQuery])

  const weekSummary = weekQuery.data?.summary
  const latestRecipes = latestRecipesQuery.data?.items ?? EMPTY_RECIPES

  // Generate random rotations for cards to give a scrapbook feel
  const cardStyles = useMemo(() => {
    return latestRecipes.map((_, i) => ({
      transform: `rotate(${i % 2 === 0 ? (Math.random() * -2 - 0.5) : (Math.random() * 2 + 0.5)}deg)`,
      marginLeft: i % 2 === 0 ? '0' : '32px',
      marginRight: i % 2 === 0 ? '32px' : '0'
    }))
  }, [latestRecipes])

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
        {!sessionReady || latestRecipesQuery.isLoading ? (
          <LoadingState title="正在翻开菜谱记忆" description="最近做过的菜谱正在赶来首页。" />
        ) : latestRecipesQuery.isError ? (
          <ErrorState
            title="菜谱卡片加载失败"
            description="这次没取到最近菜谱，你可以稍后重试，或者先去菜谱库查看全部。"
            onAction={() => void latestRecipesQuery.refetch()}
          />
        ) : (
          <View className={styles.memoryGrid}>
            {latestRecipes.map((recipe, index) => (
              <View
                className={styles.memoryCard}
                key={recipe.id}
                onClick={() => navigateToRoute(routes.recipeDetail, { id: recipe.id })}
                style={cardStyles[index]}
              >
                <View className={styles.memoryImageWrap}>
                  <Image 
                    className="recipe-cover" 
                    mode="aspectFill" 
                    src={recipe.coverImageUrl || ''} 
                    style={{ height: index % 2 === 0 ? '480px' : '400px' }}
                  />
                  <View className={styles.memoryDateBadge} style={{ transform: index % 2 === 0 ? 'rotate(1.2deg)' : 'rotate(-3deg)' }}>
                    <Text className={styles.memoryDateText}>
                      {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                    </Text>
                  </View>
                </View>
                
                <View className={styles.memoryBody}>
                  <View className={styles.memoryTitleRow}>
                    <View className={styles.memoryLine} />
                    <Text className="recipe-name" style={{ fontSize: '36px' }}>{recipe.name}</Text>
                  </View>
                  
                  <Text className={styles.memoryNote}>
                    “{recipe.currentVersion?.versionName || '这道菜的味道，值得被时光铭记。'}”
                  </Text>
                  
                  <View className="chip-row">
                    <View className="chip">
                      <Text>#{recipe.currentVersion?.category?.name || '未分类'}</Text>
                    </View>
                    {(recipe.currentVersion?.tags || []).slice(0, 1).map((tag) => (
                      <View className="chip chip--soft" key={tag.id}>
                        <Text>#{tag.name}</Text>
                      </View>
                    ))}
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
