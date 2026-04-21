import { useEffect, useState } from 'react'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { Icon, Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { PageContainer } from '@/components/base/PageContainer'
import { EmptyState } from '@/components/base/EmptyState'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { routes } from '@/constants/routes'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { recipeService } from '@/services/modules/recipe'
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
  }, [keyword])

  const recipesQuery = useQuery({
    queryKey: ['recipes', 'library', keyword, page, PAGE_SIZE],
    queryFn: () =>
      recipeService.getRecipes({
        keyword,
        page,
        pageSize: PAGE_SIZE
      })
  })

  usePageShowRefetch([recipesQuery])

  const result = recipesQuery.data
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1

  return (
    <PageContainer title="菜谱库" subtitle="发现你的家传味道">
      <View className="page-stack">
        <View className={styles.filterHero}>
          <Text className="eyebrow">Recipe Atlas</Text>
          <Text className={styles.filterHeroTitle}>
            想起哪道家的味道，就先搜一搜；没有的话，马上把它记成一张新菜谱。
          </Text>
          <View className={styles.filterSummary}>
            <View className={styles.summaryPill}>
              <Text>关键词检索</Text>
            </View>
            <View className={styles.summaryPill}>
              <Text>{viewMode === 'grid' ? '双列卡片' : '长列表'}</Text>
            </View>
            {keyword.trim() ? (
              <View
                className={styles.clearAction}
                onClick={() => {
                  setKeyword('')
                }}
              >
                <SvgIcon className={styles.actionIcon} name="guanbi" size={20} color={svgIconColors.primary} />
                <Text>清空搜索</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className={styles.searchSection}>
          <View className={styles.searchContainer}>
            <Icon className={styles.searchIcon} type="search" size={22} color="#6b705c" />
            <Input
              className={styles.searchInput}
              placeholder="搜索味蕾记忆..."
              value={keyword}
              onInput={(event) => setKeyword(event.detail.value)}
            />
            <View
              className={styles.createAction}
              onClick={() => navigateToRoute(routes.recipeEdit)}
            >
              <SvgIcon
                className={styles.createActionIcon}
                name="jiahao"
                size={20}
                color={svgIconColors.onPrimary}
              />
              <Text className={styles.createActionLabel}>新建</Text>
            </View>
          </View>
        </View>

        <View className={styles.filterSection}>
          <View className={styles.filterHeader}>
            <View>
              <Text className="section-title">展示方式</Text>
              <Text className={styles.filterHint}>搜索词变更时会自动回到第一页，方便继续往下翻看。</Text>
            </View>
            <View className={styles.viewSwitch}>
              <View
                className={`${styles.viewToggle} ${viewMode === 'list' ? styles.viewToggleActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                <SvgIcon
                  className={styles.viewToggleIcon}
                  name="liebiao"
                  size={20}
                  color={viewMode === 'list' ? svgIconColors.onPrimary : svgIconColors.secondary}
                />
                <Text>长列表</Text>
              </View>
              <View
                className={`${styles.viewToggle} ${viewMode === 'grid' ? styles.viewToggleActive : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <SvgIcon
                  className={styles.viewToggleIcon}
                  name="gongge"
                  size={20}
                  color={viewMode === 'grid' ? svgIconColors.onPrimary : svgIconColors.secondary}
                />
                <Text>双列卡片</Text>
              </View>
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
                <SvgIcon
                  className={styles.paginationIcon}
                  name="zuojiantou"
                  size={20}
                  color={svgIconColors.primary}
                />
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
                <SvgIcon
                  className={styles.paginationIcon}
                  name="youjiantou"
                  size={20}
                  color={svgIconColors.primary}
                />
              </View>
            </View>
          </>
        ) : (
          <EmptyState
            title="还没有找到对应菜谱"
            description="换个关键词再搜，或者点右侧新建按钮，把这道家常味先记下来。"
          />
        )}
      </View>
    </PageContainer>
  )
}
