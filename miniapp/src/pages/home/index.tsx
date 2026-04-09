import { useQuery } from '@tanstack/react-query'
import { Image, Text, View } from '@tarojs/components'
import { routes } from '@/constants/routes'
import { PageContainer } from '@/components/base/PageContainer'
import { useSessionQuery } from '@/features/auth/query'
import { mealPlanService } from '@/services/modules/meal-plan'
import { recipeService } from '@/services/modules/recipe'
import { navigateToRoute } from '@/utils/navigation'

export default function HomePage() {
  const sessionQuery = useSessionQuery()
  const weekQuery = useQuery({
    queryKey: ['meal-plan', 'current-week'],
    queryFn: mealPlanService.getCurrentWeekPlan
  })
  const latestRecipesQuery = useQuery({
    queryKey: ['recipes', 'home-latest'],
    queryFn: () => recipeService.getRecipes({ page: 1, pageSize: 2 })
  })

  return (
    <PageContainer title="食光记" subtitle={`欢迎回来，${sessionQuery.data?.nickname || '主厨'}`}>
      <View className="page-stack">
        {/* Weekly Menu Status Section */}
        <View className="hero-card" onClick={() => navigateToRoute(routes.mealPlanner)}>
          <View style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Text className="eyebrow">本周计划</Text>
              <Text className="editorial-title">
                已安排 {weekQuery.data?.summary.completedMeals || 0} 顿餐食
              </Text>
              <Text className="muted-text" style={{ fontSize: '24px' }}>
                {weekQuery.data?.summary.summary || '快去开启本周的美味旅程吧'}
              </Text>
            </View>
            <View style={{ 
              backgroundColor: 'var(--color-primary)', 
              color: 'var(--color-on-primary)', 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-floating)'
            }}
            >
              <Text style={{ fontSize: '40px' }}>📅</Text>
            </View>
          </View>
          {/* Decorative Background Element */}
          <View style={{ 
            position: 'absolute', 
            right: '-40px', 
            top: '-40px', 
            opacity: 0.05,
            transform: 'rotate(15deg)'
          }}
          >
            <Text style={{ fontSize: '200px' }}>🍽️</Text>
          </View>
        </View>

        {/* Memories Feed Header */}
        <View style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 8px' }}>
          <Text className="section-title">时光锦囊</Text>
          <Text className="inline-link" onClick={() => navigateToRoute(routes.recipeLibrary)}>查看全部</Text>
        </View>

        {/* Memories Feed (Scrapbook Style) */}
        <View className="page-stack" style={{ gap: '60px' }}>
          {latestRecipesQuery.data?.items.map((recipe, index) => (
            <View
              className={`memory-card ${index % 2 === 0 ? 'scrapbook-angle-1' : 'scrapbook-angle-2'}`}
              key={recipe.id}
              onClick={() => navigateToRoute(routes.recipeDetail, { id: recipe.id })}
              style={{ marginLeft: index % 2 === 0 ? '0' : '32px' }}
            >
              <View style={{ position: 'relative', marginBottom: '24px', overflow: 'hidden', borderRadius: '12px' }}>
                <Image 
                  className="recipe-cover" 
                  mode="aspectFill" 
                  src={recipe.coverImageUrl || ''} 
                  style={{ height: index % 2 === 0 ? '480px' : '400px' }}
                />
                <View style={{ 
                  position: 'absolute', 
                  top: '24px', 
                  right: '24px', 
                  backgroundColor: 'rgba(254, 239, 218, 0.9)', 
                  padding: '8px 20px', 
                  borderRadius: '999px',
                  transform: index % 2 === 0 ? 'rotate(1.2deg)' : 'rotate(-3deg)'
                }}
                >
                  <Text style={{ fontSize: '20px', color: 'var(--color-on-tertiary-container)', fontWeight: 600 }}>
                    {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                  </Text>
                </View>
              </View>
              
              <View style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <View style={{ width: '40px', height: '2px', backgroundColor: 'var(--color-primary-dim)', opacity: 0.3 }} />
                  <Text className="recipe-name" style={{ fontSize: '36px' }}>{recipe.name}</Text>
                </View>
                
                <Text className="muted-text" style={{ fontSize: '26px', fontStyle: 'italic' }}>
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
      </View>
      
      {/* Floating Action Button */}
      <View style={{
        position: 'fixed',
        bottom: '48px',
        right: '48px',
        width: '112px',
        height: '112px',
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-on-primary)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 12px 32px rgba(168, 69, 51, 0.3)',
        zIndex: 100
      }} onClick={() => navigateToRoute(routes.recipeEdit)}
      >
        <Text style={{ fontSize: '60px' }}>+</Text>
      </View>
    </PageContainer>
  )
}
