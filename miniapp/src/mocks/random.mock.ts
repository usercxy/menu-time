import dayjs from 'dayjs'
import { createMockMealPlanItem, getMockWeekPlan } from '@/mocks/meal-plan.mock'
import {
  getMockRecipeDetail,
  getMockRecipeList,
  getMockRecipeVersionDetail,
  getMockRecipeVersions
} from '@/mocks/recipe.mock'
import type {
  RandomPickDecision,
  RandomPickFiltersPayload,
  RandomPickResultAcceptPayload,
  RandomPickResultAcceptResultDTO,
  RandomPickResultDTO,
  RandomPickResultSkipResultDTO,
  RandomPickSessionCreatePayload,
  RandomPickSessionCreateResultDTO,
  RandomPickSessionDetailDTO,
  RandomPickSessionSummaryDTO
} from '@/services/types/random'
import type { RecipeDetailDTO, RecipeListItemDTO } from '@/services/types/recipe'

interface MockRandomSession {
  session: RandomPickSessionSummaryDTO
  results: RandomPickResultDTO[]
}

const randomSessionStore = new Map<string, MockRandomSession>()
let sessionSequence = 1
let resultSequence = 1

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getCurrentWeekStartDate() {
  return dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
}

function normalizeFilters(filters: RandomPickFiltersPayload | undefined, weekStartDate: string) {
  return {
    weekStartDate,
    categoryIds: filters?.categoryIds || [],
    tagIds: filters?.tagIds || [],
    maxDifficulty: filters?.maxDifficulty ?? null,
    excludeRecentDays: filters?.excludeRecentDays ?? null,
    excludeCurrentWeekPlanned: filters?.excludeCurrentWeekPlanned ?? true,
    preferredMemberTags: filters?.preferredMemberTags || []
  }
}

function restoreFilters(snapshot: MockRandomSession['session']['filterSnapshot']): RandomPickFiltersPayload {
  return {
    categoryIds: snapshot.categoryIds,
    tagIds: snapshot.tagIds,
    maxDifficulty: snapshot.maxDifficulty ?? undefined,
    excludeRecentDays: snapshot.excludeRecentDays ?? undefined,
    excludeCurrentWeekPlanned: snapshot.excludeCurrentWeekPlanned,
    preferredMemberTags: snapshot.preferredMemberTags
  }
}

function inferDifficulty(recipe: RecipeDetailDTO) {
  const stepCount = recipe.currentVersion?.steps.length || 1
  if (stepCount <= 2) {
    return 2
  }

  if (stepCount <= 3) {
    return 3
  }

  return 4
}

function getCandidates(filters: RandomPickFiltersPayload | undefined, weekStartDate: string) {
  const recipes = getMockRecipeList({ page: 1, pageSize: 100 }).items
  const plannedRecipeIds = new Set(
    filters?.excludeCurrentWeekPlanned === false
      ? []
      : getMockWeekPlan(weekStartDate).items.map((item) => item.recipe.id)
  )
  const recentCutoff = filters?.excludeRecentDays
    ? dayjs().subtract(filters.excludeRecentDays, 'day')
    : null

  const strictCandidates = recipes.filter((recipe) => {
    const currentVersion = recipe.currentVersion
    if (!currentVersion) {
      return false
    }

    if (plannedRecipeIds.has(recipe.id)) {
      return false
    }

    if (recentCutoff && recipe.latestCookedAt && dayjs(recipe.latestCookedAt).isAfter(recentCutoff)) {
      return false
    }

    if (filters?.categoryIds?.length && !filters.categoryIds.includes(currentVersion.category?.id || '')) {
      return false
    }

    if (
      filters?.tagIds?.length &&
      !filters.tagIds.some((tagId) => currentVersion.tags.some((tag) => tag.id === tagId))
    ) {
      return false
    }

    if (filters?.maxDifficulty && inferDifficulty(getMockRecipeDetail(recipe.id)) > filters.maxDifficulty) {
      return false
    }

    return true
  })

  if (strictCandidates.length) {
    return strictCandidates
  }

  // Mock fallback mirrors the backend's similar-recommendation behavior.
  return recipes.filter((recipe) => !plannedRecipeIds.has(recipe.id))
}

function buildRandomResult(
  recipe: RecipeListItemDTO,
  sequenceNo: number,
  pickedForDate: string | null,
  filters: RandomPickFiltersPayload | undefined
): RandomPickResultDTO {
  const detail = getMockRecipeDetail(recipe.id)
  const version = detail.currentVersion || getMockRecipeVersionDetail(recipe.id, recipe.currentVersion?.id || '')
  const availableVersions = getMockRecipeVersions(recipe.id, { page: 1, pageSize: 20 }).items.map((item) => ({
    id: item.id,
    versionNumber: item.versionNumber,
    versionName: item.versionName || null
  }))

  return {
    id: `random_result_${resultSequence++}`,
    sequenceNo,
    pickedForDate,
    decision: 'pending',
    reasonMeta: {
      strategy: 'mock_weighted',
      inferredDifficulty: inferDifficulty(detail),
      categoryMatch: Boolean(filters?.categoryIds?.includes(version.category?.id || '')),
      tagMatch: Boolean(filters?.tagIds?.some((tagId) => version.tags.some((tag) => tag.id === tagId))),
      classification: version.category?.name || '家常菜'
    },
    recipe: {
      id: recipe.id,
      name: recipe.name,
      coverImageUrl: recipe.coverImageUrl || null
    },
    recipeVersion: {
      id: version.id,
      versionNumber: version.versionNumber,
      versionName: version.versionName || null,
      category: version.category ? { ...version.category, color: null } : null,
      tags: version.tags.map((tag, index) => ({ ...tag, sortOrder: index })),
      difficultyRating: inferDifficulty(detail)
    },
    availableVersions,
    createdAt: new Date().toISOString()
  }
}

function syncSession(session: MockRandomSession) {
  session.session.resultCount = session.results.length
  const pendingCount = session.results.filter((result) => result.decision === 'pending').length
  const hasAccepted = session.results.some((result) => result.decision === 'accepted')

  if (session.session.mode === 'single' && hasAccepted) {
    session.session.status = 'completed'
    return
  }

  session.session.status = pendingCount ? 'running' : 'completed'
}

function getSessionOrThrow(id: string) {
  const session = randomSessionStore.get(id)
  if (!session) {
    throw new Error('随机点菜 session 不存在，请重新开始。')
  }

  return session
}

export function createMockRandomPickSession(payload: RandomPickSessionCreatePayload): RandomPickSessionCreateResultDTO {
  const weekStartDate = payload.weekStartDate || getCurrentWeekStartDate()
  const candidates = getCandidates(payload.filters, weekStartDate)

  if (!candidates.length) {
    throw new Error('当前筛选没有可抽取菜谱，请放宽分类、标签或最近吃过限制。')
  }

  const sessionId = `random_session_${sessionSequence++}`
  const resultCount = payload.mode === 'week' ? 7 : 1
  const results = Array.from({ length: resultCount }).map((_, index) =>
    buildRandomResult(
      candidates[index % candidates.length],
      index + 1,
      payload.mode === 'week' ? dayjs(weekStartDate).add(index, 'day').format('YYYY-MM-DD') : null,
      payload.filters
    )
  )
  const session: MockRandomSession = {
    session: {
      id: sessionId,
      mode: payload.mode,
      status: 'running',
      weekStartDate,
      filterSnapshot: normalizeFilters(payload.filters, weekStartDate),
      resultCount: results.length,
      createdAt: new Date().toISOString()
    },
    results
  }
  randomSessionStore.set(sessionId, session)

  return {
    sessionId,
    mode: session.session.mode,
    status: session.session.status,
    weekStartDate: session.session.weekStartDate,
    filterSnapshot: session.session.filterSnapshot,
    results: clone(results)
  }
}

export function getMockRandomPickSessionDetail(id: string): RandomPickSessionDetailDTO {
  return clone(getSessionOrThrow(id))
}

export function redrawMockRandomPickSession(id: string) {
  const session = getSessionOrThrow(id)
  if (session.session.mode !== 'single') {
    throw new Error('只有单抽模式支持再来一次。')
  }

  session.results = session.results.map((result) =>
    result.decision === 'pending' ? { ...result, decision: 'skipped' as RandomPickDecision } : result
  )
  const restoredFilters = restoreFilters(session.session.filterSnapshot)
  const candidates = getCandidates(restoredFilters, session.session.weekStartDate || getCurrentWeekStartDate())
  const skippedRecipeIds = new Set(
    session.results.filter((result) => result.decision === 'skipped').map((result) => result.recipe.id)
  )
  const available = candidates.filter((recipe) => !skippedRecipeIds.has(recipe.id))
  if (!available.length) {
    throw new Error('本轮可抽取候选已经用完，请放宽条件后重新开始。')
  }

  const result = buildRandomResult(
    available[0],
    session.results.length + 1,
    null,
    restoredFilters
  )
  session.results.push(result)
  syncSession(session)

  return {
    sessionId: id,
    result: clone(result)
  }
}

export function acceptMockRandomPickResult(
  sessionId: string,
  resultId: string,
  payload: RandomPickResultAcceptPayload
): RandomPickResultAcceptResultDTO {
  const session = getSessionOrThrow(sessionId)
  const result = session.results.find((item) => item.id === resultId)
  if (!result) {
    throw new Error('随机结果不存在，请刷新后重试。')
  }

  if (result.decision === 'accepted') {
    throw new Error('这道菜已经加入点菜台。')
  }

  const plannedDate = payload.plannedDate || result.pickedForDate
  if (!plannedDate) {
    throw new Error('请先选择计划日期。')
  }

  const weekStartDate = dayjs(plannedDate).startOf('week').add(1, 'day').format('YYYY-MM-DD')
  const created = createMockMealPlanItem(weekStartDate, {
    recipeId: result.recipe.id,
    recipeVersionId: payload.recipeVersionId || result.recipeVersion.id,
    plannedDate,
    mealSlot: payload.mealSlot || 'dinner',
    note: payload.note || '来自随机点菜',
    sourceType: 'random'
  })

  result.decision = 'accepted'
  if (payload.recipeVersionId) {
    const selected = result.availableVersions.find((version) => version.id === payload.recipeVersionId)
    if (selected) {
      result.recipeVersion.id = selected.id
      result.recipeVersion.versionNumber = selected.versionNumber
      result.recipeVersion.versionName = selected.versionName
    }
  }
  syncSession(session)

  return {
    accepted: true,
    mealPlanItemId: created.id
  }
}

export function skipMockRandomPickResult(sessionId: string, resultId: string): RandomPickResultSkipResultDTO {
  const session = getSessionOrThrow(sessionId)
  const result = session.results.find((item) => item.id === resultId)
  if (!result) {
    throw new Error('随机结果不存在，请刷新后重试。')
  }

  if (result.decision === 'accepted') {
    throw new Error('已接受的结果不能跳过。')
  }

  result.decision = 'skipped'
  syncSession(session)

  return { skipped: true }
}
