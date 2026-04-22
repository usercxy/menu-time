import dayjs from 'dayjs'
import { request } from '@/services/request/client'
import type {
  CreateMealPlanItemPayload,
  CurrentWeekPlanDTO,
  DeleteMealPlanItemResultDTO,
  MealPlanItemDTO,
  MealPlanMutationResultDTO,
  MealPlanWeekRawDTO,
  MealSlotDTO,
  MealWeekDayDTO,
  ReorderMealPlanItemsPayload,
  UpdateMealPlanItemPayload
} from '@/services/types/meal-plan'

type LegacyCurrentWeekPlanDTO = {
  summary?: CurrentWeekPlanDTO['summary']
  todayMeals?: MealSlotDTO[]
}

const SLOT_LABEL_MAP: Record<MealPlanItemDTO['mealSlot'], MealSlotDTO['mealType']> = {
  lunch: '午餐',
  dinner: '晚餐',
  extra: '加餐'
}

const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const

export function getCurrentWeekStartDate() {
  return dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD')
}

function getWeekLabel(weekStartDate: string) {
  const date = dayjs(weekStartDate)
  const weekIndex = Math.ceil(date.date() / 7)
  return `${date.format('M')}月第${weekIndex}周`
}

function buildSummary(plannedItemCount: number, weekStartDate: string): CurrentWeekPlanDTO['summary'] {
  const targetMeals = 7

  if (!plannedItemCount) {
    return {
      weekLabel: getWeekLabel(weekStartDate),
      completedMeals: 0,
      targetMeals,
      summary: '这周还没安排菜谱，先从一道想吃的家常菜开始吧。'
    }
  }

  if (plannedItemCount >= targetMeals) {
    return {
      weekLabel: getWeekLabel(weekStartDate),
      completedMeals: plannedItemCount,
      targetMeals,
      summary: '这周已经排得很满了，接下来更适合微调顺序和备注。'
    }
  }

  return {
    weekLabel: getWeekLabel(weekStartDate),
    completedMeals: plannedItemCount,
    targetMeals,
    summary: `这周已安排 ${plannedItemCount} 道菜，再补 ${targetMeals - plannedItemCount} 道会更从容。`
  }
}

function buildTodayMeals(items: MealPlanItemDTO[], today: string) {
  return items
    .filter((item) => item.plannedDate === today)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map<MealSlotDTO>((item) => ({
      id: item.id,
      mealType: SLOT_LABEL_MAP[item.mealSlot],
      recipeName: item.recipe.name,
      note: item.note || `${SLOT_LABEL_MAP[item.mealSlot]}安排`,
      plannedDate: item.plannedDate,
      coverImageUrl: item.recipe.coverImageUrl
    }))
}

function buildWeekDays(items: MealPlanItemDTO[], weekStartDate: string): MealWeekDayDTO[] {
  const today = dayjs().format('YYYY-MM-DD')
  const days = WEEKDAY_LABELS.map((label, index) => {
    const currentDate = dayjs(weekStartDate).add(index, 'day')
    const fullDate = currentDate.format('YYYY-MM-DD')

    return {
      key: fullDate,
      name: label,
      dateLabel: currentDate.format('DD'),
      fullDate,
      mealCount: items.filter((item) => item.plannedDate === fullDate).length,
      active: fullDate === today
    }
  })

  if (days.some((day) => day.active)) {
    return days
  }

  return days.map((day, index) => ({
    ...day,
    active: index === 0
  }))
}

function normalizeWeekPlan(raw: MealPlanWeekRawDTO): CurrentWeekPlanDTO {
  const today = dayjs().format('YYYY-MM-DD')

  return {
    ...raw,
    summary: buildSummary(raw.plannedItemCount, raw.weekStartDate),
    todayMeals: buildTodayMeals(raw.items, today),
    weekDays: buildWeekDays(raw.items, raw.weekStartDate)
  }
}

function isLegacyPlan(value: MealPlanWeekRawDTO | LegacyCurrentWeekPlanDTO): value is LegacyCurrentWeekPlanDTO {
  return !('weekStartDate' in value)
}

function normalizeLegacyPlan(raw: LegacyCurrentWeekPlanDTO): CurrentWeekPlanDTO {
  const today = dayjs().format('YYYY-MM-DD')
  const weekStartDate = getCurrentWeekStartDate()

  return {
    id: 'mock-current-week',
    weekStartDate,
    status: 'draft',
    plannedItemCount: raw.todayMeals?.length || raw.summary?.completedMeals || 0,
    items: [],
    summary:
      raw.summary || {
        weekLabel: getWeekLabel(weekStartDate),
        completedMeals: raw.todayMeals?.length || 0,
        targetMeals: 7,
        summary: '本周菜单已加载。'
      },
    todayMeals:
      raw.todayMeals?.map((item) => ({
        ...item,
        plannedDate: item.plannedDate || today
      })) || [],
    weekDays: buildWeekDays([], weekStartDate)
  }
}

function mapRawWeekPlan(raw: MealPlanWeekRawDTO | LegacyCurrentWeekPlanDTO) {
  return isLegacyPlan(raw) ? normalizeLegacyPlan(raw) : normalizeWeekPlan(raw)
}

export const mealPlanService = {
  async getCurrentWeekPlan() {
    const response = await request<MealPlanWeekRawDTO | LegacyCurrentWeekPlanDTO>({
      url: '/api/v1/menu-plans/current-week'
    })

    return mapRawWeekPlan(response.data)
  },
  async getWeekPlan(weekStartDate: string) {
    const response = await request<MealPlanWeekRawDTO>({
      url: `/api/v1/menu-plans/weeks/${weekStartDate}`
    })

    return normalizeWeekPlan(response.data)
  },
  async createMealPlanItem(weekStartDate: string, payload: CreateMealPlanItemPayload) {
    const response = await request<MealPlanMutationResultDTO>({
      url: `/api/v1/menu-plans/weeks/${weekStartDate}/items`,
      method: 'POST',
      data: payload
    })

    return response.data
  },
  async updateMealPlanItem(id: string, payload: UpdateMealPlanItemPayload) {
    const response = await request<MealPlanMutationResultDTO>({
      url: `/api/v1/menu-plans/items/${id}`,
      method: 'PATCH',
      data: payload
    })

    return response.data
  },
  async deleteMealPlanItem(id: string) {
    const response = await request<DeleteMealPlanItemResultDTO>({
      url: `/api/v1/menu-plans/items/${id}`,
      method: 'DELETE'
    })

    return response.data
  },
  async reorderMealPlanItems(weekStartDate: string, payload: ReorderMealPlanItemsPayload) {
    const response = await request<MealPlanWeekRawDTO>({
      url: `/api/v1/menu-plans/weeks/${weekStartDate}/reorder`,
      method: 'POST',
      data: payload
    })

    return normalizeWeekPlan(response.data)
  }
}
