import { Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/transactions";

export const mealPlanWeekDetailArgs =
  Prisma.validator<Prisma.MealPlanWeekDefaultArgs>()({
    include: {
      items: {
        orderBy: [
          { plannedDate: "asc" },
          { mealSlot: "asc" },
          { sortOrder: "asc" },
          { createdAt: "asc" },
        ],
        include: {
          recipe: {
            include: {
              coverImage: true,
            },
          },
          recipeVersion: {
            select: {
              id: true,
              versionNumber: true,
              versionName: true,
            },
          },
        },
      },
    },
  });

export type MealPlanWeekDetailRecord = Prisma.MealPlanWeekGetPayload<
  typeof mealPlanWeekDetailArgs
>;

export type MealPlanItemRecord = MealPlanWeekDetailRecord["items"][number];

export async function findMealPlanWeekByWeekStartDate(
  db: DbClient,
  input: {
    householdId: string;
    weekStartDate: Date;
  },
) {
  return db.mealPlanWeek.findUnique({
    where: {
      householdId_weekStartDate: {
        householdId: input.householdId,
        weekStartDate: input.weekStartDate,
      },
    },
    include: mealPlanWeekDetailArgs.include,
  });
}

export async function createMealPlanWeek(
  db: DbClient,
  input: {
    householdId: string;
    weekStartDate: Date;
    createdById: string;
  },
) {
  return db.mealPlanWeek.create({
    data: {
      householdId: input.householdId,
      weekStartDate: input.weekStartDate,
      createdById: input.createdById,
    },
    include: mealPlanWeekDetailArgs.include,
  });
}

export async function findMealPlanItemById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
  },
) {
  return db.mealPlanItem.findFirst({
    where: {
      id: input.id,
      mealPlanWeek: {
        householdId: input.householdId,
      },
    },
    include: {
      mealPlanWeek: true,
      recipe: {
        include: {
          coverImage: true,
        },
      },
      recipeVersion: {
        select: {
          id: true,
          versionNumber: true,
          versionName: true,
        },
      },
    },
  });
}

export async function getNextSortOrder(
  db: DbClient,
  input: {
    mealPlanWeekId: string;
    plannedDate: Date;
    mealSlot: string;
    excludeId?: string;
  },
) {
  const aggregate = await db.mealPlanItem.aggregate({
    where: {
      mealPlanWeekId: input.mealPlanWeekId,
      plannedDate: input.plannedDate,
      mealSlot: input.mealSlot,
      ...(input.excludeId
        ? {
            id: {
              not: input.excludeId,
            },
          }
        : {}),
    },
    _max: {
      sortOrder: true,
    },
  });

  return (aggregate._max.sortOrder ?? -1) + 1;
}

export async function createMealPlanItem(
  db: DbClient,
  input: {
    mealPlanWeekId: string;
    recipeId: string;
    recipeVersionId: string;
    plannedDate: Date;
    mealSlot: string;
    sortOrder: number;
    note: string | null;
    sourceType: string;
    randomSessionId?: string | null;
  },
) {
  return db.mealPlanItem.create({
    data: {
      mealPlanWeekId: input.mealPlanWeekId,
      recipeId: input.recipeId,
      recipeVersionId: input.recipeVersionId,
      plannedDate: input.plannedDate,
      mealSlot: input.mealSlot,
      sortOrder: input.sortOrder,
      note: input.note,
      sourceType: input.sourceType,
      randomSessionId: input.randomSessionId,
    },
  });
}

export async function updateMealPlanItemById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
    recipeVersionId?: string;
    plannedDate?: Date;
    mealSlot?: string;
    sortOrder?: number;
    note?: string | null;
  },
) {
  const result = await db.mealPlanItem.updateMany({
    where: {
      id: input.id,
      mealPlanWeek: {
        householdId: input.householdId,
      },
    },
    data: {
      ...(input.recipeVersionId !== undefined
        ? { recipeVersionId: input.recipeVersionId }
        : {}),
      ...(input.plannedDate !== undefined ? { plannedDate: input.plannedDate } : {}),
      ...(input.mealSlot !== undefined ? { mealSlot: input.mealSlot } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    },
  });

  return result.count > 0;
}

export async function deleteMealPlanItemById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
  },
) {
  const result = await db.mealPlanItem.deleteMany({
    where: {
      id: input.id,
      mealPlanWeek: {
        householdId: input.householdId,
      },
    },
  });

  return result.count > 0;
}

export async function listMealPlanItemsByBucket(
  db: DbClient,
  input: {
    mealPlanWeekId: string;
    plannedDate: Date;
    mealSlot: string;
  },
) {
  return db.mealPlanItem.findMany({
    where: {
      mealPlanWeekId: input.mealPlanWeekId,
      plannedDate: input.plannedDate,
      mealSlot: input.mealSlot,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function compactMealPlanItemSortOrders(
  db: DbClient,
  input: {
    mealPlanWeekId: string;
    plannedDate: Date;
    mealSlot: string;
  },
) {
  const items = await listMealPlanItemsByBucket(db, input);

  await Promise.all(
    items.map((item: { id: string; sortOrder: number }, index: number) =>
      item.sortOrder === index
        ? Promise.resolve()
        : db.mealPlanItem.update({
            where: {
              id: item.id,
            },
            data: {
              sortOrder: index,
            },
          }),
    ),
  );
}
