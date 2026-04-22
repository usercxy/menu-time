import type { AuthSession } from "@/server/lib/auth/session";
import { withTransaction, type DbClient } from "@/server/db/transactions";
import { AppError, errorCodes } from "@/server/lib/errors";
import { requireRequestHouseholdId } from "@/server/lib/request/context";
import { mapMealPlanWeekDto } from "@/server/modules/plans/plans.mapper";
import * as plansRepository from "@/server/modules/plans/plans.repository";
import type {
  DeleteMealPlanItemResultDto,
  MealPlanItemCreatePayload,
  MealPlanItemUpdatePayload,
  MealPlanMutationResultDto,
  MealPlanReorderPayload,
  MealPlanWeekDto,
} from "@/server/modules/plans/plans.types";
import * as recipesRepository from "@/server/modules/recipes/recipes.repository";

type SessionInput = {
  session?: Pick<AuthSession, "householdId" | "userId"> | null;
};

type MealPlanWeekServiceInput = SessionInput & {
  weekStartDate: string;
};

type CreateMealPlanItemServiceInput = SessionInput & {
  weekStartDate: string;
  data: MealPlanItemCreatePayload;
};

type UpdateMealPlanItemServiceInput = SessionInput & {
  id: string;
  data: MealPlanItemUpdatePayload;
};

type DeleteMealPlanItemServiceInput = SessionInput & {
  id: string;
};

type ReorderMealPlanItemsServiceInput = SessionInput & {
  weekStartDate: string;
  data: MealPlanReorderPayload;
};

function resolvePlansHouseholdId(session?: Pick<AuthSession, "householdId"> | null) {
  return session?.householdId ?? requireRequestHouseholdId();
}

function resolveActingUserId(session?: Pick<AuthSession, "userId"> | null) {
  if (!session?.userId) {
    throw new AppError("未登录或登录已失效", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  return session.userId;
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseDateOnly(value: string, fieldName: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${fieldName} 不是合法日期`, {
      code: errorCodes.VALIDATION_ERROR,
      statusCode: 400,
    });
  }

  return parsed;
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getWeekStartDateForToday() {
  const today = new Date();
  const utc = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const day = utc.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diffToMonday);
  return utc;
}

function assertWeekStartDateIsMonday(date: Date) {
  const day = date.getUTCDay();

  if (day !== 1) {
    throw new AppError("weekStartDate 必须是周一", {
      code: errorCodes.BUSINESS_RULE_VIOLATION,
      statusCode: 422,
    });
  }
}

function assertDateInWeek(plannedDate: Date, weekStartDate: Date) {
  const diffDays = Math.floor(
    (plannedDate.getTime() - weekStartDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays < 0 || diffDays > 6) {
    throw new AppError("plannedDate 必须落在目标周范围内", {
      code: errorCodes.BUSINESS_RULE_VIOLATION,
      statusCode: 422,
    });
  }
}

async function ensureMealPlanWeek(
  db: DbClient,
  input: {
    householdId: string;
    weekStartDate: Date;
    createdById: string;
  },
) {
  const existing = await plansRepository.findMealPlanWeekByWeekStartDate(db, {
    householdId: input.householdId,
    weekStartDate: input.weekStartDate,
  });

  if (existing) {
    return existing;
  }

  return plansRepository.createMealPlanWeek(db, input);
}

async function assertRecipeAndVersionValid(
  db: DbClient,
  input: {
    householdId: string;
    recipeId: string;
    recipeVersionId: string;
  },
) {
  const recipe = await recipesRepository.findRecipeById(db, {
    householdId: input.householdId,
    id: input.recipeId,
  });

  if (!recipe) {
    throw new AppError("菜谱不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  const recipeVersion = await recipesRepository.findRecipeVersionById(db, {
    householdId: input.householdId,
    recipeId: input.recipeId,
    versionId: input.recipeVersionId,
  });

  if (!recipeVersion) {
    throw new AppError("recipeVersionId 必须属于 recipeId", {
      code: errorCodes.BUSINESS_RULE_VIOLATION,
      statusCode: 422,
    });
  }

  return {
    recipe,
    recipeVersion,
  };
}

async function getMealPlanWeekOrThrow(
  db: DbClient,
  input: {
    householdId: string;
    weekStartDate: Date;
    createdById: string;
  },
) {
  const week = await ensureMealPlanWeek(db, input);
  return week;
}

export async function getCurrentMealPlanWeek(
  input: SessionInput,
): Promise<MealPlanWeekDto> {
  const householdId = resolvePlansHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);
  const week = await withTransaction(async (tx) =>
    getMealPlanWeekOrThrow(tx, {
      householdId,
      weekStartDate: getWeekStartDateForToday(),
      createdById,
    }),
  );

  return mapMealPlanWeekDto(week);
}

export async function getMealPlanWeek(
  input: MealPlanWeekServiceInput,
): Promise<MealPlanWeekDto> {
  const householdId = resolvePlansHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);
  const weekStartDate = parseDateOnly(input.weekStartDate, "weekStartDate");
  assertWeekStartDateIsMonday(weekStartDate);

  const week = await withTransaction(async (tx) =>
    getMealPlanWeekOrThrow(tx, {
      householdId,
      weekStartDate,
      createdById,
    }),
  );

  return mapMealPlanWeekDto(week);
}

export async function createMealPlanItem(
  input: CreateMealPlanItemServiceInput,
): Promise<MealPlanMutationResultDto> {
  const householdId = resolvePlansHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);
  const weekStartDate = parseDateOnly(input.weekStartDate, "weekStartDate");
  const plannedDate = parseDateOnly(input.data.plannedDate, "plannedDate");
  assertWeekStartDateIsMonday(weekStartDate);
  assertDateInWeek(plannedDate, weekStartDate);

  const item = await withTransaction(async (tx) => {
    const week = await getMealPlanWeekOrThrow(tx, {
      householdId,
      weekStartDate,
      createdById,
    });

    await assertRecipeAndVersionValid(tx, {
      householdId,
      recipeId: input.data.recipeId,
      recipeVersionId: input.data.recipeVersionId,
    });

    const sortOrder = await plansRepository.getNextSortOrder(tx, {
      mealPlanWeekId: week.id,
      plannedDate,
      mealSlot: input.data.mealSlot,
    });

    return plansRepository.createMealPlanItem(tx, {
      mealPlanWeekId: week.id,
      recipeId: input.data.recipeId,
      recipeVersionId: input.data.recipeVersionId,
      plannedDate,
      mealSlot: input.data.mealSlot,
      sortOrder,
      note: normalizeText(input.data.note),
      sourceType: input.data.sourceType ?? "manual",
    });
  });

  return {
    id: item.id,
  };
}

export async function updateMealPlanItem(
  input: UpdateMealPlanItemServiceInput,
): Promise<MealPlanMutationResultDto> {
  const householdId = resolvePlansHouseholdId(input.session);

  const updated = await withTransaction(async (tx) => {
    const existing = await plansRepository.findMealPlanItemById(tx, {
      householdId,
      id: input.id,
    });

    if (!existing) {
      throw new AppError("菜单项不存在", {
        code: errorCodes.NOT_FOUND,
        statusCode: 404,
      });
    }

    const targetPlannedDate =
      input.data.plannedDate !== undefined
        ? parseDateOnly(input.data.plannedDate, "plannedDate")
        : existing.plannedDate;
    const targetMealSlot = input.data.mealSlot ?? existing.mealSlot;

    assertDateInWeek(targetPlannedDate, existing.mealPlanWeek.weekStartDate);

    if (input.data.recipeVersionId !== undefined) {
      await assertRecipeAndVersionValid(tx, {
        householdId,
        recipeId: existing.recipeId,
        recipeVersionId: input.data.recipeVersionId,
      });
    }

    const movedBucket =
      formatDateOnly(existing.plannedDate) !== formatDateOnly(targetPlannedDate) ||
      existing.mealSlot !== targetMealSlot;

    let nextSortOrder: number | undefined;
    if (movedBucket) {
      nextSortOrder = await plansRepository.getNextSortOrder(tx, {
        mealPlanWeekId: existing.mealPlanWeekId,
        plannedDate: targetPlannedDate,
        mealSlot: targetMealSlot,
        excludeId: existing.id,
      });
    }

    await plansRepository.updateMealPlanItemById(tx, {
      householdId,
      id: input.id,
      ...(input.data.recipeVersionId !== undefined
        ? { recipeVersionId: input.data.recipeVersionId }
        : {}),
      ...(input.data.plannedDate !== undefined ? { plannedDate: targetPlannedDate } : {}),
      ...(input.data.mealSlot !== undefined ? { mealSlot: targetMealSlot } : {}),
      ...(nextSortOrder !== undefined ? { sortOrder: nextSortOrder } : {}),
      ...(input.data.note !== undefined ? { note: normalizeText(input.data.note) } : {}),
    });

    if (movedBucket) {
      await plansRepository.compactMealPlanItemSortOrders(tx, {
        mealPlanWeekId: existing.mealPlanWeekId,
        plannedDate: existing.plannedDate,
        mealSlot: existing.mealSlot,
      });
      await plansRepository.compactMealPlanItemSortOrders(tx, {
        mealPlanWeekId: existing.mealPlanWeekId,
        plannedDate: targetPlannedDate,
        mealSlot: targetMealSlot,
      });
    }

    return existing.id;
  });

  return {
    id: updated,
  };
}

export async function deleteMealPlanItem(
  input: DeleteMealPlanItemServiceInput,
): Promise<DeleteMealPlanItemResultDto> {
  const householdId = resolvePlansHouseholdId(input.session);

  await withTransaction(async (tx) => {
    const existing = await plansRepository.findMealPlanItemById(tx, {
      householdId,
      id: input.id,
    });

    if (!existing) {
      throw new AppError("菜单项不存在", {
        code: errorCodes.NOT_FOUND,
        statusCode: 404,
      });
    }

    await plansRepository.deleteMealPlanItemById(tx, {
      householdId,
      id: input.id,
    });

    await plansRepository.compactMealPlanItemSortOrders(tx, {
      mealPlanWeekId: existing.mealPlanWeekId,
      plannedDate: existing.plannedDate,
      mealSlot: existing.mealSlot,
    });
  });

  return {
    deleted: true,
  };
}

export async function reorderMealPlanItems(
  input: ReorderMealPlanItemsServiceInput,
): Promise<MealPlanWeekDto> {
  const householdId = resolvePlansHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);
  const weekStartDate = parseDateOnly(input.weekStartDate, "weekStartDate");
  const plannedDate = parseDateOnly(input.data.plannedDate, "plannedDate");
  assertWeekStartDateIsMonday(weekStartDate);
  assertDateInWeek(plannedDate, weekStartDate);

  const week = await withTransaction(async (tx) => {
    const mealPlanWeek = await getMealPlanWeekOrThrow(tx, {
      householdId,
      weekStartDate,
      createdById,
    });

    const bucketItems = await plansRepository.listMealPlanItemsByBucket(tx, {
      mealPlanWeekId: mealPlanWeek.id,
      plannedDate,
      mealSlot: input.data.mealSlot,
    });

    if (bucketItems.length !== input.data.items.length) {
      throw new AppError("重排 items 必须覆盖目标餐次下的全部菜单项", {
        code: errorCodes.BUSINESS_RULE_VIOLATION,
        statusCode: 422,
      });
    }

    const bucketIds = new Set(bucketItems.map((item: { id: string }) => item.id));
    for (const item of input.data.items) {
      if (!bucketIds.has(item.id)) {
        throw new AppError("存在不属于目标餐次的菜单项", {
          code: errorCodes.BUSINESS_RULE_VIOLATION,
          statusCode: 422,
        });
      }
    }

    const normalized = [...input.data.items]
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
      .map((item, index) => ({
        id: item.id,
        sortOrder: index,
      }));

    await Promise.all(
      normalized.map((item) =>
        plansRepository.updateMealPlanItemById(tx, {
          householdId,
          id: item.id,
          sortOrder: item.sortOrder,
        }),
      ),
    );

    const refreshed = await plansRepository.findMealPlanWeekByWeekStartDate(tx, {
      householdId,
      weekStartDate,
    });

    if (!refreshed) {
      throw new AppError("周菜单不存在", {
        code: errorCodes.NOT_FOUND,
        statusCode: 404,
      });
    }

    return refreshed;
  });

  return mapMealPlanWeekDto(week);
}
