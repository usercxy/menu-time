import { Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/transactions";

export const shoppingListDetailArgs =
  Prisma.validator<Prisma.ShoppingListDefaultArgs>()({
    include: {
      mealPlanWeek: true,
      items: {
        orderBy: [{ itemType: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

export const shoppingListGenerationWeekArgs =
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
            select: {
              id: true,
              name: true,
            },
          },
          recipeVersion: {
            select: {
              id: true,
              versionNumber: true,
              versionName: true,
              ingredients: {
                orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
              },
            },
          },
        },
      },
    },
  });

export type ShoppingListDetailRecord = Prisma.ShoppingListGetPayload<
  typeof shoppingListDetailArgs
>;
export type ShoppingListItemRecord = ShoppingListDetailRecord["items"][number];
export type MealPlanWeekForShoppingGenerationRecord = Prisma.MealPlanWeekGetPayload<
  typeof shoppingListGenerationWeekArgs
>;

export async function findMealPlanWeekForGeneration(
  db: DbClient,
  input: {
    householdId: string;
    weekStartDate: Date;
  },
) {
  return db.mealPlanWeek.findFirst({
    where: {
      householdId: input.householdId,
      weekStartDate: input.weekStartDate,
    },
    include: shoppingListGenerationWeekArgs.include,
  });
}

export async function findLatestActiveShoppingListByWeekId(
  db: DbClient,
  input: {
    householdId: string;
    mealPlanWeekId: string;
  },
) {
  return db.shoppingList.findFirst({
    where: {
      householdId: input.householdId,
      mealPlanWeekId: input.mealPlanWeekId,
      status: "active",
    },
    orderBy: [{ versionNo: "desc" }],
    include: {
      items: {
        orderBy: [{ itemType: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

export async function archiveShoppingListsByWeekId(
  db: DbClient,
  input: {
    householdId: string;
    mealPlanWeekId: string;
  },
) {
  const existing = await db.shoppingList.findMany({
    where: {
      householdId: input.householdId,
      mealPlanWeekId: input.mealPlanWeekId,
      status: "active",
    },
    select: {
      id: true,
    },
  });

  if (existing.length === 0) {
    return [];
  }

  await db.shoppingList.updateMany({
    where: {
      id: {
        in: existing.map((item: { id: string }) => item.id),
      },
    },
    data: {
      status: "archived",
    },
  });

  return existing.map((item: { id: string }) => item.id);
}

export async function getNextShoppingListVersionNo(
  db: DbClient,
  input: {
    mealPlanWeekId: string;
  },
) {
  const aggregate = await db.shoppingList.aggregate({
    where: {
      mealPlanWeekId: input.mealPlanWeekId,
    },
    _max: {
      versionNo: true,
    },
  });

  return (aggregate._max.versionNo ?? 0) + 1;
}

export async function createShoppingList(
  db: DbClient,
  input: {
    householdId: string;
    mealPlanWeekId: string;
    generatedFrom: string;
    versionNo: number;
    createdById: string;
    items: Array<{
      itemType: string;
      displayName: string;
      normalizedName: string;
      quantityNote: string | null;
      sourceCount: number;
      isChecked: boolean;
      sortOrder: number;
      sourceRecipeRefs: Prisma.InputJsonValue;
    }>;
  },
) {
  return db.shoppingList.create({
    data: {
      householdId: input.householdId,
      mealPlanWeekId: input.mealPlanWeekId,
      generatedFrom: input.generatedFrom,
      versionNo: input.versionNo,
      createdById: input.createdById,
      items: {
        create: input.items,
      },
    },
    include: shoppingListDetailArgs.include,
  });
}

export async function findShoppingListById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
  },
) {
  return db.shoppingList.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
    },
    include: shoppingListDetailArgs.include,
  });
}

export async function findShoppingListItemById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
  },
) {
  return db.shoppingListItem.findFirst({
    where: {
      id: input.id,
      shoppingList: {
        householdId: input.householdId,
      },
    },
  });
}

export async function updateShoppingListItemById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
    isChecked?: boolean;
    quantityNote?: string | null;
  },
) {
  const result = await db.shoppingListItem.updateMany({
    where: {
      id: input.id,
      shoppingList: {
        householdId: input.householdId,
      },
    },
    data: {
      ...(input.isChecked !== undefined ? { isChecked: input.isChecked } : {}),
      ...(input.quantityNote !== undefined ? { quantityNote: input.quantityNote } : {}),
    },
  });

  return result.count > 0;
}

export async function getMealPlanWeekLastUpdatedAt(
  db: DbClient,
  input: {
    mealPlanWeekId: string;
  },
) {
  const [week, items] = await Promise.all([
    db.mealPlanWeek.findUnique({
      where: {
        id: input.mealPlanWeekId,
      },
      select: {
        updatedAt: true,
      },
    }),
    db.mealPlanItem.aggregate({
      where: {
        mealPlanWeekId: input.mealPlanWeekId,
      },
      _max: {
        updatedAt: true,
      },
    }),
  ]);

  return items._max.updatedAt ?? week?.updatedAt ?? null;
}
