import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Image, Input, Picker, Text, Textarea, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import dayjs from 'dayjs'
import { PageContainer } from '@/components/base/PageContainer'
import { EmptyState } from '@/components/base/EmptyState'
import { ErrorState } from '@/components/base/ErrorState'
import { LoadingState } from '@/components/base/LoadingState'
import { SvgIcon } from '@/components/base/SvgIcon'
import { svgIconColors } from '@/components/base/SvgIcon/iconColors'
import { routes } from '@/constants/routes'
import { useAppQuery as useQuery } from '@/hooks/useAppQuery'
import { usePageShowRefetch } from '@/hooks/usePageShowRefetch'
import { randomService } from '@/services/modules/random'
import { taxonomyService } from '@/services/modules/taxonomy'
import type { MealPlanSlotKey } from '@/services/types/meal-plan'
import type {
  RandomPickMode,
  RandomPickResultAcceptPayload,
  RandomPickResultDTO,
  RandomPickSessionDetailDTO
} from '@/services/types/random'
import { getSafeImageUrl } from '@/utils/media-url'
import { navigateToRoute } from '@/utils/navigation'
import { queryClient } from '@/utils/query-client'
import styles from './index.module.scss'

const DEFAULT_RANDOM_COVER_URL =
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80'
const SLOT_OPTIONS: Array<{ key: MealPlanSlotKey; label: string }> = [
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'extra', label: '加餐' }
]
const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5]

interface AcceptDraft {
  plannedDate: string
  mealSlot: MealPlanSlotKey
  recipeVersionId: string
  note: string
}

function getCurrentWeekStartDate() {
  return dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
}

function normalizeWeekStartDate(value: string) {
  return dayjs(value).startOf('week').add(1, 'day').format('YYYY-MM-DD')
}

function parseMemberTags(input: string) {
  return input
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getDecisionLabel(decision: RandomPickResultDTO['decision']) {
  if (decision === 'accepted') {
    return '已加入'
  }

  if (decision === 'skipped') {
    return '已跳过'
  }

  return '待决定'
}

function buildDetailFromCreate(result: Awaited<ReturnType<typeof randomService.createRandomPickSession>>): RandomPickSessionDetailDTO {
  return {
    session: {
      id: result.sessionId,
      mode: result.mode,
      status: result.status,
      weekStartDate: result.weekStartDate,
      filterSnapshot: result.filterSnapshot,
      resultCount: result.results.length,
      createdAt: new Date().toISOString()
    },
    results: result.results
  }
}

export default function RandomPickPage() {
  const router = useRouter()
  const initialWeekStartDate = router.params.weekStartDate || getCurrentWeekStartDate()
  const initialSessionId = router.params.id || router.params.sessionId || ''
  const [mode, setMode] = useState<RandomPickMode>('single')
  const [weekStartDate, setWeekStartDate] = useState(initialWeekStartDate)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [maxDifficulty, setMaxDifficulty] = useState<number | undefined>(3)
  const [excludeRecentDays, setExcludeRecentDays] = useState('7')
  const [excludeCurrentWeekPlanned, setExcludeCurrentWeekPlanned] = useState(true)
  const [preferredMemberTagsInput, setPreferredMemberTagsInput] = useState('')
  const [sessionId, setSessionId] = useState(initialSessionId)
  const [acceptDrafts, setAcceptDrafts] = useState<Record<string, AcceptDraft>>({})
  const [emptyHint, setEmptyHint] = useState('')
  const [isRolling, setIsRolling] = useState(false)

  const categoriesQuery = useQuery({
    queryKey: ['taxonomy', 'categories'],
    queryFn: taxonomyService.getCategories
  })
  const tagsQuery = useQuery({
    queryKey: ['taxonomy', 'tags'],
    queryFn: taxonomyService.getTags
  })
  const sessionQuery = useQuery({
    queryKey: ['random-session', sessionId],
    queryFn: () => randomService.getRandomPickSessionDetail(sessionId),
    enabled: Boolean(sessionId)
  })

  usePageShowRefetch([categoriesQuery, tagsQuery, sessionId ? sessionQuery : null])

  const createSessionMutation = useMutation({
    mutationFn: () =>
      randomService.createRandomPickSession({
        mode,
        weekStartDate,
        filters: {
          categoryIds: selectedCategoryIds,
          tagIds: selectedTagIds,
          maxDifficulty,
          excludeRecentDays: excludeRecentDays.trim() ? Number(excludeRecentDays) : undefined,
          excludeCurrentWeekPlanned,
          preferredMemberTags: parseMemberTags(preferredMemberTagsInput)
        }
      })
  })
  const redrawMutation = useMutation({
    mutationFn: () => randomService.redrawRandomPickSession(sessionId)
  })
  const acceptMutation = useMutation({
    mutationFn: ({ resultId, payload }: { resultId: string; payload: RandomPickResultAcceptPayload }) =>
      randomService.acceptRandomPickResult(sessionId, resultId, payload)
  })
  const skipMutation = useMutation({
    mutationFn: (resultId: string) => randomService.skipRandomPickResult(sessionId, resultId)
  })

  const sessionDetail = sessionQuery.data
  const results = sessionDetail?.results || []
  const pendingResults = results.filter((result) => result.decision === 'pending')
  const heroResult = pendingResults[pendingResults.length - 1] || results[results.length - 1] || null
  const selectedCategories = useMemo(
    () => categoriesQuery.data?.filter((category) => selectedCategoryIds.includes(category.id)) || [],
    [categoriesQuery.data, selectedCategoryIds]
  )
  const selectedTags = useMemo(
    () => tagsQuery.data?.filter((tag) => selectedTagIds.includes(tag.id)) || [],
    [selectedTagIds, tagsQuery.data]
  )

  const filterSummary = useMemo(() => {
    const parts = [mode === 'single' ? '单抽模式' : '整周连抽']
    if (selectedCategories.length) {
      parts.push(`分类 ${selectedCategories.map((item) => item.name).join('、')}`)
    }
    if (selectedTags.length) {
      parts.push(`标签 ${selectedTags.map((item) => item.name).join('、')}`)
    }
    if (maxDifficulty) {
      parts.push(`难度 <= ${maxDifficulty}`)
    }
    if (excludeRecentDays.trim()) {
      parts.push(`排除最近 ${excludeRecentDays} 天`)
    }
    if (excludeCurrentWeekPlanned) {
      parts.push('排除本周已规划')
    }

    return parts.join(' · ')
  }, [excludeCurrentWeekPlanned, excludeRecentDays, maxDifficulty, mode, selectedCategories, selectedTags])

  const getDraft = (result: RandomPickResultDTO): AcceptDraft =>
    acceptDrafts[result.id] || {
      plannedDate: result.pickedForDate || dayjs(weekStartDate).format('YYYY-MM-DD'),
      mealSlot: 'dinner',
      recipeVersionId: result.recipeVersion.id,
      note: mode === 'week' ? '整周随机点菜' : '选择困难时刻随机命中'
    }

  const updateDraft = (resultId: string, patch: Partial<AcceptDraft>) => {
    setAcceptDrafts((current) => {
      const matchedResult = results.find((item) => item.id === resultId)
      const base = matchedResult
        ? getDraft(matchedResult)
        : {
            plannedDate: dayjs(weekStartDate).format('YYYY-MM-DD'),
            mealSlot: 'dinner' as MealPlanSlotKey,
            recipeVersionId: '',
            note: ''
          }

      return {
        ...current,
        [resultId]: {
          ...base,
          ...patch
        }
      }
    })
  }

  const handleStart = async () => {
    setEmptyHint('')
    setIsRolling(true)
    try {
      const result = await createSessionMutation.mutateAsync()
      const detail = buildDetailFromCreate(result)
      setSessionId(result.sessionId)
      queryClient.setQueryData(['random-session', result.sessionId], detail)
      Taro.vibrateShort({ type: 'medium' })
      Taro.showToast({ title: mode === 'single' ? '抽到啦' : '已生成整周', icon: 'success' })
    } catch (error) {
      setEmptyHint(error instanceof Error ? error.message : '当前没有可抽取菜谱，请放宽筛选条件。')
    } finally {
      setTimeout(() => setIsRolling(false), 460)
    }
  }

  const handleRedraw = async () => {
    if (!sessionId) {
      return
    }

    setIsRolling(true)
    try {
      await redrawMutation.mutateAsync()
      await queryClient.invalidateQueries({ queryKey: ['random-session', sessionId] })
      Taro.vibrateShort({ type: 'medium' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '重抽失败', icon: 'none' })
    } finally {
      setTimeout(() => setIsRolling(false), 420)
    }
  }

  const handleSkip = async (result: RandomPickResultDTO) => {
    try {
      await skipMutation.mutateAsync(result.id)
      await queryClient.invalidateQueries({ queryKey: ['random-session', sessionId] })
      Taro.showToast({ title: '已跳过', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '跳过失败', icon: 'none' })
    }
  }

  const handleAccept = async (result: RandomPickResultDTO) => {
    const draft = getDraft(result)
    try {
      await acceptMutation.mutateAsync({
        resultId: result.id,
        payload: {
          plannedDate: draft.plannedDate,
          mealSlot: draft.mealSlot,
          recipeVersionId: draft.recipeVersionId,
          note: draft.note.trim() || null
        }
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['random-session', sessionId] }),
        queryClient.invalidateQueries({ queryKey: ['meal-plan'] })
      ])
      Taro.showToast({ title: '已加入点菜台', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '加入点菜台失败', icon: 'none' })
    }
  }

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const toggleTag = (id: string) => {
    setSelectedTagIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const renderResultCard = (result: RandomPickResultDTO, featured = false) => {
    const draft = getDraft(result)
    const versionRange = result.availableVersions.map((version) => `V${version.versionNumber}${version.versionName ? ` · ${version.versionName}` : ''}`)
    const selectedVersionIndex = Math.max(result.availableVersions.findIndex((version) => version.id === draft.recipeVersionId), 0)
    const slotIndex = Math.max(SLOT_OPTIONS.findIndex((item) => item.key === draft.mealSlot), 0)
    const disabled = result.decision !== 'pending'

    return (
      <View className={`${styles.resultCard} ${featured ? styles.resultCardFeatured : ''}`} key={result.id}>
        <Image className={styles.resultImage} mode="aspectFill" src={getSafeImageUrl(result.recipe.coverImageUrl, DEFAULT_RANDOM_COVER_URL)} />
        <View className={styles.resultBody}>
          <View className={styles.resultTitleRow}>
            <View>
              <Text className={styles.recipeName}>{result.recipe.name}</Text>
              <Text className={styles.versionText}>
                V{result.recipeVersion.versionNumber}{result.recipeVersion.versionName ? ` · ${result.recipeVersion.versionName}` : ''}
              </Text>
            </View>
            <View className={disabled ? styles.decisionPillMuted : styles.decisionPill}>
              <Text>{getDecisionLabel(result.decision)}</Text>
            </View>
          </View>
          <View className="chip-row">
            {result.recipeVersion.category ? <View className="chip"><Text>{result.recipeVersion.category.name}</Text></View> : null}
            <View className="chip chip--soft"><Text>难度 {result.recipeVersion.difficultyRating}</Text></View>
            {result.pickedForDate ? <View className="chip chip--soft"><Text>{dayjs(result.pickedForDate).format('M/D')}</Text></View> : null}
          </View>

          <View className={styles.acceptPanel}>
            <Picker mode="date" value={draft.plannedDate} onChange={(event) => updateDraft(result.id, { plannedDate: event.detail.value })} disabled={disabled}>
              <View className={styles.pickerField}><Text>{draft.plannedDate}</Text></View>
            </Picker>
            <Picker range={SLOT_OPTIONS.map((item) => item.label)} value={slotIndex} onChange={(event) => updateDraft(result.id, { mealSlot: SLOT_OPTIONS[Number(event.detail.value)]?.key || 'dinner' })} disabled={disabled}>
              <View className={styles.pickerField}><Text>{SLOT_OPTIONS[slotIndex]?.label || '晚餐'}</Text></View>
            </Picker>
            <Picker range={versionRange} value={selectedVersionIndex} onChange={(event) => updateDraft(result.id, { recipeVersionId: result.availableVersions[Number(event.detail.value)]?.id || result.recipeVersion.id })} disabled={disabled}>
              <View className={styles.pickerFieldWide}><Text>{versionRange[selectedVersionIndex] || '当前版本'}</Text></View>
            </Picker>
            <Textarea
              className={styles.noteInput}
              value={draft.note}
              disabled={disabled}
              placeholder="加入点菜台的备注"
              onInput={(event) => updateDraft(result.id, { note: event.detail.value })}
            />
          </View>

          <View className={styles.resultActions}>
            <View className={styles.ghostAction} onClick={() => navigateToRoute(routes.recipeDetail, { id: result.recipe.id })}>
              <Text>看详情</Text>
            </View>
            <View className={`${styles.secondaryAction} ${disabled ? styles.actionDisabled : ''}`} onClick={() => !disabled && void handleSkip(result)}>
              <Text>{skipMutation.isPending ? '处理中' : '跳过'}</Text>
            </View>
            <View className={`${styles.primaryAction} ${disabled ? styles.actionDisabled : ''}`} onClick={() => !disabled && void handleAccept(result)}>
              <Text>{acceptMutation.isPending ? '加入中' : '就它了'}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <PageContainer title="随机点菜" subtitle="把选择困难交给食光" showBack>
      <View className="page-stack">
        <View className={styles.heroCard}>
          <Text className="eyebrow">Decision Spinner</Text>
          <Text className={styles.heroTitle}>给今天或这一周一个不用纠结的答案。</Text>
          <Text className={styles.heroDescription}>{filterSummary}</Text>
          <View className={styles.modeSwitch}>
            <View className={`${styles.modePill} ${mode === 'single' ? styles.modePillActive : ''}`} onClick={() => setMode('single')}><Text>单抽一道</Text></View>
            <View className={`${styles.modePill} ${mode === 'week' ? styles.modePillActive : ''}`} onClick={() => setMode('week')}><Text>整周连抽</Text></View>
          </View>
        </View>

        <View className={styles.filterCard}>
          <View className={styles.fieldBlock}>
            <Text className={styles.fieldLabel}>目标周</Text>
            <Picker mode="date" value={weekStartDate} onChange={(event) => setWeekStartDate(normalizeWeekStartDate(event.detail.value))}>
              <View className={styles.pickerFieldWide}><Text>{weekStartDate}</Text></View>
            </Picker>
          </View>

          <View className={styles.fieldBlock}>
            <Text className={styles.fieldLabel}>分类</Text>
            <View className={styles.chipWrap}>
              {categoriesQuery.data?.map((category) => (
                <View className={`${styles.filterChip} ${selectedCategoryIds.includes(category.id) ? styles.filterChipActive : ''}`} key={category.id} onClick={() => toggleCategory(category.id)}>
                  <Text>{category.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.fieldBlock}>
            <Text className={styles.fieldLabel}>标签</Text>
            <View className={styles.chipWrap}>
              {tagsQuery.data?.map((tag) => (
                <View className={`${styles.filterChip} ${selectedTagIds.includes(tag.id) ? styles.filterChipActive : ''}`} key={tag.id} onClick={() => toggleTag(tag.id)}>
                  <Text>#{tag.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.fieldGrid}>
            <View className={styles.fieldBlock}>
              <Text className={styles.fieldLabel}>难度上限</Text>
              <View className={styles.chipWrapCompact}>
                {DIFFICULTY_OPTIONS.map((value) => (
                  <View className={`${styles.filterChip} ${maxDifficulty === value ? styles.filterChipActive : ''}`} key={value} onClick={() => setMaxDifficulty(maxDifficulty === value ? undefined : value)}>
                    <Text>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.fieldBlock}>
              <Text className={styles.fieldLabel}>排除最近 N 天</Text>
              <Input className={styles.textInput} type="number" value={excludeRecentDays} onInput={(event) => setExcludeRecentDays(event.detail.value)} />
            </View>
          </View>

          <View className={styles.fieldBlock}>
            <Text className={styles.fieldLabel}>成员偏好标签</Text>
            <Input className={styles.textInput} placeholder="例如：孩子爱吃, 清淡" value={preferredMemberTagsInput} onInput={(event) => setPreferredMemberTagsInput(event.detail.value)} />
          </View>

          <View className={styles.optionRow} onClick={() => setExcludeCurrentWeekPlanned((current) => !current)}>
            <View className={`${styles.checkDot} ${excludeCurrentWeekPlanned ? styles.checkDotActive : ''}`}><Text>{excludeCurrentWeekPlanned ? '✓' : ''}</Text></View>
            <Text className={styles.optionText}>排除当前周已经规划过的菜</Text>
          </View>

          <View className={`${styles.startAction} ${createSessionMutation.isPending ? styles.actionDisabled : ''}`} onClick={() => !createSessionMutation.isPending && void handleStart()}>
            <SvgIcon className={styles.startIcon} name="shuaxin" size={24} color={svgIconColors.onPrimary} />
            <Text>{createSessionMutation.isPending ? '正在抽取...' : '开始随机'}</Text>
          </View>
        </View>

        {emptyHint ? (
          <EmptyState
            title="没有合适候选"
            description={emptyHint}
            actionText="放宽条件再试"
            onAction={() => {
              setSelectedCategoryIds([])
              setSelectedTagIds([])
              setMaxDifficulty(undefined)
              setExcludeRecentDays('')
              setEmptyHint('')
            }}
          />
        ) : null}

        {sessionId && sessionQuery.isLoading ? (
          <LoadingState title="随机结果加载中" description="正在读取本次 session 的抽取历史。" />
        ) : sessionId && sessionQuery.isError ? (
          <ErrorState title="随机 session 没取到" description="可以重试一次，或者重新开始一轮随机点菜。" onAction={() => void sessionQuery.refetch()} />
        ) : heroResult ? (
          <View className={`${styles.resultStage} ${isRolling ? styles.resultStageRolling : ''}`}>
            <View className={styles.stageHeader}>
              <View>
                <Text className="section-title">本次命中</Text>
                <Text className={styles.stageSubtitle}>Session {sessionDetail?.session.status === 'completed' ? '已完成' : '进行中'} · 共 {results.length} 条结果</Text>
              </View>
              {sessionDetail?.session.mode === 'single' ? (
                <View className={styles.secondaryAction} onClick={() => void handleRedraw()}>
                  <Text>{redrawMutation.isPending ? '重抽中' : '再来一次'}</Text>
                </View>
              ) : null}
            </View>
            {renderResultCard(heroResult, true)}
          </View>
        ) : null}

        {results.length ? (
          <View className={styles.historyCard}>
            <View className={styles.stageHeader}>
              <View>
                <Text className="section-title">抽取历史</Text>
                <Text className={styles.stageSubtitle}>按抽取顺序保留接受、跳过与重抽结果。</Text>
              </View>
              <View className={styles.primaryAction} onClick={() => navigateToRoute(routes.mealPlanner)}><Text>回点菜台</Text></View>
            </View>
            <View className={styles.historyList}>
              {results.map((result) => renderResultCard(result))}
            </View>
          </View>
        ) : null}
      </View>
    </PageContainer>
  )
}
