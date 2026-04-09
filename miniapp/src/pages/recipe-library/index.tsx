import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input, ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { EmptyState } from '@/components/base/EmptyState'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { routes } from '@/constants/routes'
import { PageContainer } from '@/components/base/PageContainer'
import { recipeService } from '@/services/modules/recipe'
import { taxonomyService } from '@/services/modules/taxonomy'
import { navigateToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

const PAGE_SIZE = 2
const RECIPE_LIBRARY_VIEW_MODE_KEY = 'recipe-library-view-mode'

type RecipeViewMode = 'list' | 'grid'

function getStoredViewMode(): RecipeViewMode {
  try {
    const storedValue = Taro.getStorageSync(RECIPE_LIBRARY_VIEW_MODE_KEY)
    return storedValue === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

export default function RecipeLibraryPage() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<RecipeViewMode>(getStoredViewMode)

  useEffect(() => {
    try {
      Taro.setStorageSync(RECIPE_LIBRARY_VIEW_MODE_KEY, viewMode)
    } catch {
      // Ignore persistence failures in non-weapp envs.
    }
  }, [viewMode])

  useEffect(() => {
    setPage(1)
  }, [keyword, activeCategory, activeTag])

  const categoriesQuery = useQuery({
    queryKey: ['taxonomy', 'categories'],
    queryFn: taxonomyService.getCategories
  })
  const tagsQuery = useQuery({
    queryKey: ['taxonomy', 'tags'],
    queryFn: taxonomyService.getTags
  })
  const recipesQuery = useQuery({
    queryKey: ['recipes', keyword, activeCategory, activeTag, page, PAGE_SIZE],
    queryFn: () =>
      recipeService.getRecipes({
        keyword,
        categoryId: activeCategory || undefined,
        tagIds: activeTag ? [activeTag] : undefined,
        page,
        pageSize: PAGE_SIZE
      })
  })

  const selectedCategoryLabel = useMemo(
    () => categoriesQuery.data?.find((item) => item.id === activeCategory)?.name || '全部分类',
    [activeCategory, categoriesQuery.data]
  )
  const selectedTagLabel = useMemo(
    () => tagsQuery.data?.find((item) => item.id === activeTag)?.name || '全部场景',
    [activeTag, tagsQuery.data]
  )

  const result = recipesQuery.data
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1

  return (
    <PageContainer title="菜谱库" subtitle="发现你的家传味道">
      <View className="page-stack">
        <View className={styles.filterHero}>
          <Text className="eyebrow">Recipe Atlas</Text>
          <Text className={styles.filterHeroTitle}>
            今天想找什么味道？试着按分类和场景标签一起缩小范围。
          </Text>
          <View className={styles.filterSummary}>
            <View className={styles.summaryPill}>
              <Text>{selectedCategoryLabel}</Text>
            </View>
            <View className={styles.summaryPill}>
              <Text>{selectedTagLabel}</Text>
            </View>
            {(activeCategory || activeTag || keyword.trim()) ? (
              <View
                className={styles.clearAction}
                onClick={() => {
                  setKeyword('')
                  setActiveCategory(null)
                  setActiveTag(null)
                }}
              >
                <Text>清空筛选</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className={styles.searchSection}>
          <View className={styles.searchContainer}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="搜索味蕾记忆..."
              value={keyword}
              onInput={(event) => setKeyword(event.detail.value)}
            />
          </View>
        </View>

        <View className={styles.filterSection}>
          <View className={styles.filterHeader}>
            <View>
              <Text className="section-title">筛选与展示</Text>
              <Text className={styles.filterHint}>切换分类、标签或视图方式时，会自动重置到第一页。</Text>
            </View>
            <View className={styles.viewSwitch}>
              <View
                className={`${styles.viewToggle} ${viewMode === 'list' ? styles.viewToggleActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                <Text>长列表</Text>
              </View>
              <View
                className={`${styles.viewToggle} ${viewMode === 'grid' ? styles.viewToggleActive : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Text>双列卡片</Text>
              </View>
            </View>
          </View>

          <ScrollView scrollX className={styles.categoryNav} showScrollbar={false}>
            <View
              className={`${styles.categoryTab} ${activeCategory === null ? styles.categoryTabActive : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              <Text>全部</Text>
            </View>
            {categoriesQuery.data?.map((item) => (
              <View
                className={`${styles.categoryTab} ${activeCategory === item.id ? styles.categoryTabActive : ''}`}
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
              >
                <Text>{item.name}</Text>
              </View>
            ))}
          </ScrollView>

          <View className={styles.tagSection}>
            <Text className={styles.tagSectionLabel}>标签筛选</Text>
            <View className={styles.tagWrap}>
              <View
                className={`${styles.tagChip} ${activeTag === null ? styles.tagChipActive : ''}`}
                onClick={() => setActiveTag(null)}
              >
                <Text>全部场景</Text>
              </View>
              {tagsQuery.data?.map((item) => (
                <View
                  className={`${styles.tagChip} ${activeTag === item.id ? styles.tagChipActive : ''}`}
                  key={item.id}
                  onClick={() => setActiveTag(item.id)}
                >
                  <Text>#{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {recipesQuery.isLoading ? (
          <LoadingState title="菜谱列表加载中" description="正在把这周常做的味道摆上台面，请稍等一下。" />
        ) : recipesQuery.isError ? (
          <ErrorState
            title="菜谱列表暂时没取到"
            description="可以重试一次，或先调整筛选条件看看。"
            onAction={() => void recipesQuery.refetch()}
          />
        ) : result?.items.length ? (
          <>
            <View className={styles.resultSummaryCard}>
              <Text className={styles.resultSummaryTitle}>本次共找到 {result.total} 道菜</Text>
              <Text className={styles.resultSummaryDescription}>
                第 {result.page} / {totalPages} 页 · 每页 {result.pageSize} 道
              </Text>
            </View>

            <View className={viewMode === 'grid' ? styles.recipeGridCompact : styles.recipeGridList}>
              {result.items.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  viewMode={viewMode}
                  onClick={() => navigateToRoute(routes.recipeDetail, { id: recipe.id })}
                />
              ))}
            </View>

            <View className={styles.paginationBar}>
              <View
                className={`${styles.paginationAction} ${page === 1 ? styles.paginationActionDisabled : ''}`}
                onClick={() => {
                  if (page > 1) {
                    setPage((current) => current - 1)
                  }
                }}
              >
                <Text>上一页</Text>
              </View>
              <View
                className={`${styles.paginationAction} ${!result.hasMore ? styles.paginationActionDisabled : ''}`}
                onClick={() => {
                  if (result.hasMore) {
                    setPage((current) => current + 1)
                  }
                }}
              >
                <Text>下一页</Text>
              </View>
            </View>
          </>
        ) : (
          <EmptyState
            title="这组筛选下还没有菜谱"
            description="换一个标签或分类试试，也可以先去新建菜谱把这道家常味记录下来。"
          />
        )}
      </View>
    </PageContainer>
  )
}
