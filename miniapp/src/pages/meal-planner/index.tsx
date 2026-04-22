import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Image, Picker, ScrollView, Text, Textarea, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import dayjs from 'dayjs'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { routes } from '@/constants/routes'
import { PageContainer } from '@/components/base/PageContainer'
import { EmptyState } from '@/components/base/EmptyState'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { mealPlanService, getCurrentWeekStartDate } from '@/services/modules/meal-plan'
import { recipeService } from '@/services/modules/recipe'
import type { MealPlanItemDTO, MealPlanSlotKey } from '@/services/types/meal-plan'
import { getSafeImageUrl } from '@/utils/media-url'
import { clearMealPlanDraft, getMealPlanDraft } from '@/utils/meal-plan-draft'
import { queryClient } from '@/utils/query-client'
import { navigateToRoute } from '@/utils/navigation'
import styles from './index.module.scss'

const DEFAULT_MEAL_COVER_URL =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400'
const SLOT_OPTIONS: Array<{ key: MealPlanSlotKey; label: string }> = [
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'extra', label: '加餐' }
]
const EMPTY_RECIPES: Awaited<ReturnType<typeof recipeService.getRecipes>>['items'] = []
const EMPTY_VERSIONS: Awaited<ReturnType<typeof recipeService.getRecipeVersions>>['items'] = []

interface PlannerComposerState {
  open: boolean
  editingItemId?: string
  selectedRecipeId: string
  selectedRecipeVersionId: string
  plannedDate: string
  mealSlot: MealPlanSlotKey
  note: string
}

function createComposerState(plannedDate: string): PlannerComposerState {
  return {
    open: false,
    editingItemId: undefined,
    selectedRecipeId: '',
    selectedRecipeVersionId: '',
    plannedDate,
    mealSlot: 'dinner',
    note: ''
  }
}

function getSlotLabel(mealSlot: MealPlanSlotKey) {
  return SLOT_OPTIONS.find((item) => item.key === mealSlot)?.label || mealSlot
}

export default function MealPlannerPage() {
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(getCurrentWeekStartDate())
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [composer, setComposer] = useState<PlannerComposerState>(() => createComposerState(dayjs().format('YYYY-MM-DD')))

  const planQuery = useQuery({
    queryKey: ['meal-plan', selectedWeekStartDate],
    queryFn: () =>
      selectedWeekStartDate === getCurrentWeekStartDate()
        ? mealPlanService.getCurrentWeekPlan()
        : mealPlanService.getWeekPlan(selectedWeekStartDate)
  })
  const recipesQuery = useQuery({
    queryKey: ['recipes', 'planner-options'],
    queryFn: () => recipeService.getRecipes({ page: 1, pageSize: 100 })
  })
  const versionsQuery = useQuery({
    queryKey: ['recipe-versions', composer.selectedRecipeId, 'planner'],
    queryFn: () => recipeService.getRecipeVersions(composer.selectedRecipeId, { page: 1, pageSize: 20 }),
    enabled: Boolean(composer.selectedRecipeId)
  })

  usePageShowRefetch([planQuery, recipesQuery, composer.selectedRecipeId ? versionsQuery : null])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!composer.selectedRecipeId) {
        throw new Error('请先选择菜谱')
      }

      if (!composer.selectedRecipeVersionId) {
        throw new Error('请先选择版本')
      }

      if (composer.editingItemId) {
        return mealPlanService.updateMealPlanItem(composer.editingItemId, {
          recipeVersionId: composer.selectedRecipeVersionId,
          plannedDate: composer.plannedDate,
          mealSlot: composer.mealSlot,
          note: composer.note.trim() || null
        })
      }

      return mealPlanService.createMealPlanItem(selectedWeekStartDate, {
        recipeId: composer.selectedRecipeId,
        recipeVersionId: composer.selectedRecipeVersionId,
        plannedDate: composer.plannedDate,
        mealSlot: composer.mealSlot,
        note: composer.note.trim() || null,
        sourceType: 'manual'
      })
    }
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mealPlanService.deleteMealPlanItem(id)
  })
  const reorderMutation = useMutation({
    mutationFn: (payload: { plannedDate: string; mealSlot: MealPlanSlotKey; items: Array<{ id: string; sortOrder: number }> }) =>
      mealPlanService.reorderMealPlanItems(selectedWeekStartDate, payload)
  })

  const plan = planQuery.data
  const recipes = recipesQuery.data?.items ?? EMPTY_RECIPES
  const versions = versionsQuery.data?.items ?? EMPTY_VERSIONS
  const selectedRecipe = recipes.find((item) => item.id === composer.selectedRecipeId) || null

  useEffect(() => {
    if (!plan?.weekDays.length) {
      return
    }

    const matchedDay = plan.weekDays.find((day) => day.fullDate === selectedDate)
    if (matchedDay) {
      return
    }

    const activeDay = plan.weekDays.find((day) => day.active) || plan.weekDays[0]
    setSelectedDate(activeDay.fullDate)
    setComposer((current) => ({
      ...current,
      plannedDate: activeDay.fullDate
    }))
  }, [plan?.weekDays, selectedDate])

  useEffect(() => {
    if (!composer.open || !composer.selectedRecipeId || !selectedRecipe?.currentVersion) {
      return
    }

    if (composer.selectedRecipeVersionId) {
      return
    }

    setComposer((current) => ({
      ...current,
      selectedRecipeVersionId: selectedRecipe.currentVersion?.id || ''
    }))
  }, [composer.open, composer.selectedRecipeId, composer.selectedRecipeVersionId, selectedRecipe?.currentVersion])

  useEffect(() => {
    if (!composer.open || !versions.length) {
      return
    }

    if (versions.some((item) => item.id === composer.selectedRecipeVersionId)) {
      return
    }

    setComposer((current) => ({
      ...current,
      selectedRecipeVersionId: versions[0]?.id || ''
    }))
  }, [composer.open, composer.selectedRecipeVersionId, versions])

  useDidShow(() => {
    const draft = getMealPlanDraft()
    if (!draft) {
      return
    }

    clearMealPlanDraft()
    setSelectedDate(draft.plannedDate || dayjs().format('YYYY-MM-DD'))
    setSelectedWeekStartDate(getCurrentWeekStartDate())
    setComposer({
      open: true,
      editingItemId: undefined,
      selectedRecipeId: draft.recipeId,
      selectedRecipeVersionId: draft.recipeVersionId || '',
      plannedDate: draft.plannedDate || dayjs().format('YYYY-MM-DD'),
      mealSlot: draft.mealSlot || 'dinner',
      note: draft.note || ''
    })
  })

  const selectedDay = plan?.weekDays.find((day) => day.fullDate === selectedDate) || null
  const selectedDayItems = useMemo(
    () => (plan?.items || []).filter((item) => item.plannedDate === selectedDate),
    [plan?.items, selectedDate]
  )

  const slotBuckets = useMemo(
    () =>
      SLOT_OPTIONS.map((slot) => ({
        ...slot,
        items: selectedDayItems
          .filter((item) => item.mealSlot === slot.key)
          .sort((left, right) => left.sortOrder - right.sortOrder)
      })),
    [selectedDayItems]
  )

  const recipePickerRange = recipes.map((item) => item.name)
  const versionPickerRange = versions.map(
    (item) => `V${item.versionNumber}${item.versionName ? ` · ${item.versionName}` : ''}`
  )

  const openCreateComposer = (defaults?: Partial<PlannerComposerState>) => {
    setComposer({
      ...createComposerState(defaults?.plannedDate || selectedDate),
      open: true,
      plannedDate: defaults?.plannedDate || selectedDate,
      mealSlot: defaults?.mealSlot || 'dinner',
      selectedRecipeId: defaults?.selectedRecipeId || '',
      selectedRecipeVersionId: defaults?.selectedRecipeVersionId || '',
      note: defaults?.note || ''
    })
  }

  const openEditComposer = (item: MealPlanItemDTO) => {
    setComposer({
      open: true,
      editingItemId: item.id,
      selectedRecipeId: item.recipe.id,
      selectedRecipeVersionId: item.recipeVersion.id,
      plannedDate: item.plannedDate,
      mealSlot: item.mealSlot,
      note: item.note || ''
    })
    setSelectedDate(item.plannedDate)
  }

  const closeComposer = () => {
    setComposer(createComposerState(selectedDate))
  }

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['meal-plan'] }),
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
      ])

      setSelectedDate(composer.plannedDate)
      closeComposer()

      Taro.showToast({
        title: composer.editingItemId ? '菜单已更新' : '已加入点菜台',
        icon: 'success'
      })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '保存失败，请稍后重试',
        icon: 'none'
      })
    }
  }

  const handleDelete = async (item: MealPlanItemDTO) => {
    const result = await Taro.showModal({
      title: '删除这道菜？',
      content: '删除后会从当前周菜单中移除，刷新页面后也不会恢复。',
      confirmText: '删除',
      confirmColor: '#ba1a1a'
    })

    if (!result.confirm) {
      return
    }

    try {
      await deleteMutation.mutateAsync(item.id)
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
      Taro.showToast({
        title: '已删除',
        icon: 'success'
      })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '删除失败，请稍后重试',
        icon: 'none'
      })
    }
  }

  const handleMove = async (items: MealPlanItemDTO[], index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= items.length) {
      return
    }

    const reordered = items.map((item) => item.id)
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    try {
      await reorderMutation.mutateAsync({
        plannedDate: items[index].plannedDate,
        mealSlot: items[index].mealSlot,
        items: reordered.map((id, order) => ({
          id,
          sortOrder: order
        }))
      })
      await queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '排序失败，请稍后重试',
        icon: 'none'
      })
    }
  }

  if (planQuery.isLoading) {
    return (
      <PageContainer title="点菜台" subtitle="正在整理本周餐单">
        <LoadingState title="本周计划准备中" description="正在把后端返回的周菜单整理成可浏览视图。" />
      </PageContainer>
    )
  }

  if (!plan || planQuery.isError) {
    return (
      <PageContainer title="点菜台" subtitle="暂时无法读取周菜单">
        <ErrorState
          title="周菜单加载失败"
          description="这次没拿到当前周计划，可以稍后重试。"
          onAction={() => void planQuery.refetch()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="点菜台" subtitle={plan.summary.weekLabel || '本周'}>
      <View className="page-stack">
        <View className={styles.heroCard}>
          <View className={styles.weekSwitchRow}>
            <View className={styles.weekSwitchButton} onClick={() => setSelectedWeekStartDate(dayjs(selectedWeekStartDate).subtract(7, 'day').format('YYYY-MM-DD'))}>
              <Text>上一周</Text>
            </View>
            <View className={styles.weekBadge}>
              <Text>{plan.summary.weekLabel}</Text>
            </View>
            <View className={styles.weekSwitchButton} onClick={() => setSelectedWeekStartDate(dayjs(selectedWeekStartDate).add(7, 'day').format('YYYY-MM-DD'))}>
              <Text>下一周</Text>
            </View>
          </View>

          <View className={styles.summaryRow}>
            <View className="stat-card">
              <Text className="stat-card__value">{plan.plannedItemCount}</Text>
              <Text className="stat-card__label">本周已规划</Text>
            </View>
            <View className="stat-card">
              <Text className="stat-card__value">{plan.todayMeals.length}</Text>
              <Text className="stat-card__label">今天安排</Text>
            </View>
          </View>

          <Text className={styles.summaryText}>{plan.summary.summary}</Text>

          <View className={styles.weekActions}>
            <View className={styles.secondaryAction} onClick={() => setSelectedWeekStartDate(getCurrentWeekStartDate())}>
              <Text>回到本周</Text>
            </View>
            <View className={styles.primaryAction} onClick={() => openCreateComposer()}>
              <Text>手动点一道菜</Text>
            </View>
          </View>
        </View>

        <View className={styles.calendarSection}>
          <View className={styles.calendarTitle}>
            <Text className="section-title">周视图</Text>
            <Text className={styles.calendarSubtitle}>{selectedDay ? dayjs(selectedDay.fullDate).format('M 月 D 日') : '请选择日期'}</Text>
          </View>
          <ScrollView scrollX className={styles.dateList} showScrollbar={false}>
            {plan.weekDays.map((day) => (
              <View
                key={day.key}
                className={`${styles.dateItem} ${selectedDate === day.fullDate ? styles['dateItem--active'] : ''}`}
                onClick={() => {
                  setSelectedDate(day.fullDate)
                  setComposer((current) => ({
                    ...current,
                    plannedDate: day.fullDate
                  }))
                }}
              >
                <Text className={styles.dayName}>{day.name}</Text>
                <Text className={styles.dayDate}>{day.dateLabel}</Text>
                <Text className={styles.dayMeta}>{day.mealCount} 道</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className={styles.randomSection}>
          <View className={styles.randomButton} onClick={() => navigateToRoute(routes.randomPick)}>
            <View className={styles.randomInfo}>
              <View className={styles.randomIcon}>
                <SvgIcon
                  className={styles.randomIconImage}
                  name="shuaxin"
                  size={44}
                  color={svgIconColors.onTertiaryContainer}
                />
              </View>
              <View className={styles.randomText}>
                <Text className={styles.randomTitle}>纠结时刻？</Text>
                <Text className={styles.randomSubtitle}>让“食光”为你随机挑选一道美味</Text>
              </View>
            </View>
            <View className={styles.arrowButton}>
              <SvgIcon className={styles.arrowIcon} name="youjiantou" size={28} color={svgIconColors.onPrimary} />
            </View>
          </View>
        </View>

        {composer.open ? (
          <View className={styles.composerCard}>
            <View className={styles.sectionHeader}>
              <Text className="section-title">{composer.editingItemId ? '编辑菜单项' : '加入周菜单'}</Text>
              <Text className={styles.sectionHint}>选择菜谱、版本、日期和餐次后即可保存到当前周。</Text>
            </View>

            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>菜谱</Text>
              {composer.editingItemId ? (
                <View className={styles.readonlyField}>
                  <Text>{selectedRecipe?.name || '当前菜单项菜谱'}</Text>
                </View>
              ) : (
                <Picker
                  mode="selector"
                  range={recipePickerRange}
                  onChange={(event) => {
                    const recipe = recipes[Number(event.detail.value)]
                    setComposer((current) => ({
                      ...current,
                      selectedRecipeId: recipe?.id || '',
                      selectedRecipeVersionId: recipe?.currentVersion?.id || '',
                      note: current.note
                    }))
                  }}
                >
                  <View className={styles.pickerField}>
                    <Text>{selectedRecipe?.name || '请选择菜谱'}</Text>
                  </View>
                </Picker>
              )}
            </View>

            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>版本</Text>
              <Picker
                mode="selector"
                range={versionPickerRange}
                onChange={(event) => {
                  const version = versions[Number(event.detail.value)]
                  setComposer((current) => ({
                    ...current,
                    selectedRecipeVersionId: version?.id || ''
                  }))
                }}
              >
                <View className={styles.pickerField}>
                  <Text>
                    {versions.find((item) => item.id === composer.selectedRecipeVersionId)
                      ? `V${versions.find((item) => item.id === composer.selectedRecipeVersionId)?.versionNumber}${
                          versions.find((item) => item.id === composer.selectedRecipeVersionId)?.versionName
                            ? ` · ${versions.find((item) => item.id === composer.selectedRecipeVersionId)?.versionName}`
                            : ''
                        }`
                      : '请选择版本'}
                  </Text>
                </View>
              </Picker>
            </View>

            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>日期</Text>
              <View className={styles.optionWrap}>
                {plan.weekDays.map((day) => (
                  <View
                    className={`${styles.optionChip} ${composer.plannedDate === day.fullDate ? styles.optionChipActive : ''}`}
                    key={day.key}
                    onClick={() =>
                      setComposer((current) => ({
                        ...current,
                        plannedDate: day.fullDate
                      }))
                    }
                  >
                    <Text>{`${day.name} ${day.dateLabel}`}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>餐次</Text>
              <View className={styles.optionWrap}>
                {SLOT_OPTIONS.map((slot) => (
                  <View
                    className={`${styles.optionChip} ${composer.mealSlot === slot.key ? styles.optionChipActive : ''}`}
                    key={slot.key}
                    onClick={() =>
                      setComposer((current) => ({
                        ...current,
                        mealSlot: slot.key
                      }))
                    }
                  >
                    <Text>{slot.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.fieldCard}>
              <Text className={styles.fieldLabel}>备注</Text>
              <Textarea
                className={styles.textarea}
                maxlength={200}
                placeholder="比如：周三晚饭、孩子爱吃、想试新版"
                value={composer.note}
                onInput={(event) =>
                  setComposer((current) => ({
                    ...current,
                    note: event.detail.value
                  }))
                }
              />
            </View>

            <View className={styles.composerActions}>
              <View className={styles.secondaryAction} onClick={closeComposer}>
                <Text>取消</Text>
              </View>
              <View className={styles.primaryAction} onClick={() => void handleSave()}>
                <Text>{saveMutation.isPending ? '保存中...' : composer.editingItemId ? '保存修改' : '加入本周'}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View className={styles.daySection}>
          <View className={styles.sectionHeader}>
            <Text className="section-title">{selectedDay ? `${dayjs(selectedDay.fullDate).format('M 月 D 日')} 的餐单` : '当日餐单'}</Text>
            <Text className={styles.sectionHint}>支持新增、改期、改版本、删除和同餐次内轻量排序。</Text>
          </View>

          {slotBuckets.every((bucket) => bucket.items.length === 0) ? (
            <EmptyState
              title="这一天还没有安排菜品"
              description="可以直接在午餐、晚餐或加餐位里手动点一道菜。"
              actionText="现在安排"
              onAction={() => openCreateComposer({ plannedDate: selectedDate })}
            />
          ) : null}

          <View className={styles.slotStack}>
            {slotBuckets.map((bucket) => (
              <View className={styles.slotPanel} key={bucket.key}>
                <View className={styles.slotHeader}>
                  <View>
                    <Text className={styles.slotTitle}>{bucket.label}</Text>
                    <Text className={styles.slotSubtitle}>{bucket.items.length ? `${bucket.items.length} 道已安排` : '还没有安排菜品'}</Text>
                  </View>
                  <View className={styles.inlineAction} onClick={() => openCreateComposer({ plannedDate: selectedDate, mealSlot: bucket.key })}>
                    <Text>添加</Text>
                  </View>
                </View>

                {bucket.items.length ? (
                  <View className={styles.mealGrid}>
                    {bucket.items.map((item, index) => (
                      <View className={styles.mealCard} key={item.id}>
                        <View className={styles.mealCoverWrap}>
                          <Image
                            className="recipe-cover"
                            mode="aspectFill"
                            src={getSafeImageUrl(item.recipe.coverImageUrl, DEFAULT_MEAL_COVER_URL)}
                            style={{ height: '100%' }}
                          />
                          <View className={styles.mealTypeBadge}>
                            <Text>{getSlotLabel(item.mealSlot)}</Text>
                          </View>
                        </View>

                        <View className={styles.mealInfo}>
                          <View className={styles.mealMeta}>
                            <Text className={styles.mealTitle}>{item.recipe.name}</Text>
                            <Text className={styles.mealVersion}>
                              {`V${item.recipeVersion.versionNumber}${item.recipeVersion.versionName ? ` · ${item.recipeVersion.versionName}` : ''}`}
                            </Text>
                            <Text className={styles.mealNote}>{item.note || '这道菜还没有备注'}</Text>
                          </View>

                          <View className={styles.cardActions}>
                            <View className={styles.mealEdit} onClick={() => openEditComposer(item)}>
                              <Text>编辑</Text>
                            </View>
                            <View
                              className={`${styles.mealEdit} ${styles.mealEditGhost}`}
                              onClick={() => void handleMove(bucket.items, index, -1)}
                            >
                              <Text>上移</Text>
                            </View>
                            <View
                              className={`${styles.mealEdit} ${styles.mealEditGhost}`}
                              onClick={() => void handleMove(bucket.items, index, 1)}
                            >
                              <Text>下移</Text>
                            </View>
                            <View className={`${styles.mealEdit} ${styles.mealDelete}`} onClick={() => void handleDelete(item)}>
                              <Text>删除</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className={styles.slotEmpty}>
                    <Text>这一餐次还空着，点一下“添加”就能补进来。</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className="surface-card" onClick={() => navigateToRoute(routes.shoppingList, { weekStartDate: plan.weekStartDate })}>
          <View className="profile-link__meta">
            <View className={styles.linkTitleRow}>
              <SvgIcon className={styles.linkTitleIcon} name="wenjian" size={26} color={svgIconColors.primary} />
              <Text className="profile-link__title">购物清单</Text>
            </View>
            <Text className="profile-link__subtitle">阶段 5 会从这里继续接入生成清单与勾选逻辑。</Text>
          </View>
          <SvgIcon
            className={styles.linkArrowIcon}
            name="youjiantou"
            size={28}
            color={svgIconColors.onSurfaceVariant}
          />
        </View>
      </View>
    </PageContainer>
  )
}
