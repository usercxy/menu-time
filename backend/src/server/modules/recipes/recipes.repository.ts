import { Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/transactions";
import type {
  RecipeIdInput,
  RecipeListInput,
  RecipeListSortBy,
  RecipeVersionIdInput,
  RecipeVersionsListInput,
  RecipeVersionWriteInput,
} from "@/server/modules/recipes/recipes.types";

function resolveArchivedFilter(includeArchived?: boolean) {
  return includeArchived ? {} : { deletedAt: null };
}

function buildRecipeListWhere(input: RecipeListInput): Prisma.RecipeWhereInput {
  const keyword = input.keyword?.trim();

  return {
    householdId: input.householdId,
    deletedAt: null,
    ...(keyword
      ? {
          name: {
            contains: keyword,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {}),
    ...(input.categoryId || (input.tagIds?.length ?? 0) > 0
      ? {
          currentVersion: {
            is: {
              ...(input.categoryId ? { categoryId: input.categoryId } : {}),
              ...(input.tagIds?.length
                ? {
                    tagLinks: {
                      some: {
                        tagId: {
                          in: input.tagIds,
                        },
                      },
                    },
                  }
                : {}),
            },
          },
        }
      : {}),
  };
}

function resolveRecipeListOrderBy(sortBy: RecipeListSortBy = "updatedAt") {
  if (sortBy === "name") {
    return [{ name: "asc" as const }, { updatedAt: "desc" as const }];
  }

  if (sortBy === "latestMomentAt") {
    return [{ latestMomentAt: "desc" as const }, { updatedAt: "desc" as const }];
  }

  return [{ updatedAt: "desc" as const }, { id: "asc" as const }];
}

export const recipeListArgs = Prisma.validator<Prisma.RecipeDefaultArgs>()({
  include: {
    coverImage: true,
    currentVersion: {
      include: {
        category: true,
        tagLinks: {
          include: {
            tag: true,
          },
        },
      },
    },
  },
});

export const recipeDetailArgs = Prisma.validator<Prisma.RecipeDefaultArgs>()({
  include: {
    coverImage: true,
    currentVersion: {
      include: {
        category: true,
        tagLinks: {
          include: {
            tag: true,
          },
        },
        steps: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
        ingredients: {
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
      },
    },
  },
});

export const recipeVersionListArgs =
  Prisma.validator<Prisma.RecipeVersionDefaultArgs>()({
    include: {
      recipe: {
        select: {
          currentVersionId: true,
        },
      },
    },
  });

export const recipeVersionDetailArgs =
  Prisma.validator<Prisma.RecipeVersionDefaultArgs>()({
    include: {
      recipe: {
        select: {
          currentVersionId: true,
        },
      },
      category: true,
      tagLinks: {
        include: {
          tag: true,
        },
      },
      steps: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
      ingredients: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
  });

export type RecipeListRecord = Prisma.RecipeGetPayload<typeof recipeListArgs>;
export type RecipeDetailRecord = Prisma.RecipeGetPayload<typeof recipeDetailArgs>;
export type RecipeVersionListRecord = Prisma.RecipeVersionGetPayload<
  typeof recipeVersionListArgs
>;
export type RecipeVersionDetailRecord = Prisma.RecipeVersionGetPayload<
  typeof recipeVersionDetailArgs
>;

export async function listRecipes(db: DbClient, input: RecipeListInput) {
  return db.recipe.findMany({
    where: buildRecipeListWhere(input),
    orderBy: resolveRecipeListOrderBy(input.sortBy),
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    include: recipeListArgs.include,
  });
}

export async function countRecipes(db: DbClient, input: RecipeListInput) {
  return db.recipe.count({
    where: buildRecipeListWhere(input),
  });
}

export async function findRecipeById(db: DbClient, input: RecipeIdInput) {
  return db.recipe.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
      ...resolveArchivedFilter(input.includeArchived),
    },
  });
}

export async function findRecipeDetailById(db: DbClient, input: RecipeIdInput) {
  return db.recipe.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
      ...resolveArchivedFilter(input.includeArchived),
    },
    include: recipeDetailArgs.include,
  });
}

export async function findActiveRecipeBySlug(
  db: DbClient,
  input: { householdId: string; slug: string; excludeId?: string },
) {
  return db.recipe.findFirst({
    where: {
      householdId: input.householdId,
      slug: input.slug,
      deletedAt: null,
      ...(input.excludeId
        ? {
            id: {
              not: input.excludeId,
            },
          }
        : {}),
    },
  });
}

export async function findMediaAssetById(
  db: DbClient,
  input: { householdId: string; id: string },
) {
  return db.mediaAsset.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
    },
  });
}

export async function createRecipe(db: DbClient, input: {
  householdId: string;
  name: string;
  slug: string | null;
  createdById: string;
}) {
  return db.recipe.create({
    data: {
      householdId: input.householdId,
      name: input.name,
      slug: input.slug,
      createdById: input.createdById,
    },
  });
}

export async function updateRecipeById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
    name?: string;
    slug?: string | null;
    coverImageId?: string | null;
    coverSource?: string;
    status?: string;
    currentVersionId?: string | null;
    versionCount?: number;
    momentCount?: number;
    latestMomentAt?: Date | null;
    latestCookedAt?: Date | null;
  },
) {
  const result = await db.recipe.updateMany({
    where: {
      id: input.id,
      householdId: input.householdId,
      deletedAt: null,
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.coverImageId !== undefined ? { coverImageId: input.coverImageId } : {}),
      ...(input.coverSource !== undefined ? { coverSource: input.coverSource } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.currentVersionId !== undefined
        ? { currentVersionId: input.currentVersionId }
        : {}),
      ...(input.versionCount !== undefined ? { versionCount: input.versionCount } : {}),
      ...(input.momentCount !== undefined ? { momentCount: input.momentCount } : {}),
      ...(input.latestMomentAt !== undefined
        ? { latestMomentAt: input.latestMomentAt }
        : {}),
      ...(input.latestCookedAt !== undefined
        ? { latestCookedAt: input.latestCookedAt }
        : {}),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return findRecipeById(db, {
    id: input.id,
    householdId: input.householdId,
    includeArchived: true,
  });
}

export async function softDeleteRecipeById(db: DbClient, input: RecipeIdInput) {
  const result = await db.recipe.updateMany({
    where: {
      id: input.id,
      householdId: input.householdId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return result.count > 0;
}

export async function listRecipeVersions(
  db: DbClient,
  input: RecipeVersionsListInput,
) {
  return db.recipeVersion.findMany({
    where: {
      recipeId: input.recipeId,
      householdId: input.householdId,
    },
    orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }],
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    include: recipeVersionListArgs.include,
  });
}

export async function countRecipeVersions(
  db: DbClient,
  input: RecipeVersionsListInput,
) {
  return db.recipeVersion.count({
    where: {
      recipeId: input.recipeId,
      householdId: input.householdId,
    },
  });
}

export async function findRecipeVersionById(
  db: DbClient,
  input: RecipeVersionIdInput,
) {
  return db.recipeVersion.findFirst({
    where: {
      id: input.versionId,
      recipeId: input.recipeId,
      householdId: input.householdId,
    },
    include: recipeVersionDetailArgs.include,
  });
}

export async function findRecipeVersionByNumber(db: DbClient, input: {
  householdId: string;
  recipeId: string;
  versionNumber: number;
}) {
  return db.recipeVersion.findFirst({
    where: {
      householdId: input.householdId,
      recipeId: input.recipeId,
      versionNumber: input.versionNumber,
    },
    include: recipeVersionDetailArgs.include,
  });
}

export async function getNextRecipeVersionNumber(
  db: DbClient,
  input: { householdId: string; recipeId: string },
) {
  const result = await db.recipeVersion.aggregate({
    where: {
      householdId: input.householdId,
      recipeId: input.recipeId,
    },
    _max: {
      versionNumber: true,
    },
  });

  return (result._max.versionNumber ?? 0) + 1;
}

export async function createRecipeVersionWithRelations(
  db: DbClient,
  input: RecipeVersionWriteInput,
) {
  return db.recipeVersion.create({
    data: {
      recipeId: input.recipeId,
      householdId: input.householdId,
      versionNumber: input.versionNumber,
      versionName: input.versionName,
      categoryId: input.categoryId,
      ingredientsText: input.ingredientsText,
      tips: input.tips,
      diffSummaryText: input.diffSummaryText,
      diffSummaryJson: input.diffSummaryJson ?? Prisma.DbNull,
      sourceVersionId: input.sourceVersionId,
      isMajor: input.isMajor,
      createdById: input.createdById,
      steps: {
        create: input.steps.map((step) => ({
          sortOrder: step.sortOrder,
          content: step.content,
        })),
      },
      ingredients: {
        create: input.ingredients.map((ingredient) => ({
          sortOrder: ingredient.sortOrder,
          rawText: ingredient.rawText,
          normalizedName: ingredient.normalizedName,
          amountText: ingredient.amountText,
          unit: ingredient.unit,
          isSeasoning: ingredient.isSeasoning,
          parseSource: ingredient.parseSource,
        })),
      },
      tagLinks: {
        create: input.tagIds.map((tagId) => ({
          tagId,
        })),
      },
    },
    include: recipeVersionDetailArgs.include,
  });
}
