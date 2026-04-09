import type { DbClient } from "@/server/db/transactions";
import type {
  CategoryCreateInput,
  CategoryReorderInput,
  CategoryUpdateInput,
  HouseholdScopedEntityInput,
  HouseholdScopedInput,
  HouseholdScopedNameInput,
  TagCreateInput,
  TagReorderInput,
  TagUpdateInput,
  TaxonomyListInput,
} from "@/server/modules/taxonomy/taxonomy.types";

function resolveArchivedFilter(includeArchived?: boolean) {
  return includeArchived ? {} : { deletedAt: null };
}

export async function listCategories(db: DbClient, input: TaxonomyListInput) {
  return db.category.findMany({
    where: {
      householdId: input.householdId,
      ...resolveArchivedFilter(input.includeArchived),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function findCategoryById(
  db: DbClient,
  input: HouseholdScopedEntityInput,
) {
  return db.category.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
      ...resolveArchivedFilter(input.includeArchived),
    },
  });
}

export async function findActiveCategoryByName(
  db: DbClient,
  input: HouseholdScopedNameInput,
) {
  return db.category.findFirst({
    where: {
      householdId: input.householdId,
      name: input.name,
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

export async function createCategory(db: DbClient, input: CategoryCreateInput) {
  return db.category.create({
    data: {
      householdId: input.householdId,
      name: input.name,
      color: input.color ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function getNextCategorySortOrder(
  db: DbClient,
  input: HouseholdScopedInput,
) {
  const result = await db.category.aggregate({
    where: {
      householdId: input.householdId,
      deletedAt: null,
    },
    _max: {
      sortOrder: true,
    },
  });

  return (result._max.sortOrder ?? -1) + 1;
}

export async function updateCategoryById(db: DbClient, input: CategoryUpdateInput) {
  const result = await db.category.updateMany({
    where: {
      id: input.id,
      householdId: input.householdId,
      deletedAt: null,
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return findCategoryById(db, {
    id: input.id,
    householdId: input.householdId,
    includeArchived: true,
  });
}

export async function softDeleteCategoryById(
  db: DbClient,
  input: HouseholdScopedEntityInput,
) {
  const result = await db.category.updateMany({
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

export async function reorderCategories(db: DbClient, input: CategoryReorderInput) {
  const results = await Promise.all(
    input.items.map((item) =>
      db.category.updateMany({
        where: {
          id: item.id,
          householdId: input.householdId,
          deletedAt: null,
        },
        data: {
          sortOrder: item.sortOrder,
        },
      }),
    ),
  );

  return results.reduce((total, result) => total + result.count, 0);
}

export async function findActiveCategoriesByIds(
  db: DbClient,
  input: HouseholdScopedInput & { ids: string[] },
) {
  return db.category.findMany({
    where: {
      householdId: input.householdId,
      id: {
        in: input.ids,
      },
      deletedAt: null,
    },
  });
}

export async function listTags(db: DbClient, input: TaxonomyListInput) {
  return db.tag.findMany({
    where: {
      householdId: input.householdId,
      ...resolveArchivedFilter(input.includeArchived),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function findTagById(db: DbClient, input: HouseholdScopedEntityInput) {
  return db.tag.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
      ...resolveArchivedFilter(input.includeArchived),
    },
  });
}

export async function findActiveTagByName(
  db: DbClient,
  input: HouseholdScopedNameInput,
) {
  return db.tag.findFirst({
    where: {
      householdId: input.householdId,
      name: input.name,
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

export async function createTag(db: DbClient, input: TagCreateInput) {
  return db.tag.create({
    data: {
      householdId: input.householdId,
      name: input.name,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function getNextTagSortOrder(db: DbClient, input: HouseholdScopedInput) {
  const result = await db.tag.aggregate({
    where: {
      householdId: input.householdId,
      deletedAt: null,
    },
    _max: {
      sortOrder: true,
    },
  });

  return (result._max.sortOrder ?? -1) + 1;
}

export async function updateTagById(db: DbClient, input: TagUpdateInput) {
  const result = await db.tag.updateMany({
    where: {
      id: input.id,
      householdId: input.householdId,
      deletedAt: null,
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return findTagById(db, {
    id: input.id,
    householdId: input.householdId,
    includeArchived: true,
  });
}

export async function softDeleteTagById(
  db: DbClient,
  input: HouseholdScopedEntityInput,
) {
  const result = await db.tag.updateMany({
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

export async function reorderTags(db: DbClient, input: TagReorderInput) {
  const results = await Promise.all(
    input.items.map((item) =>
      db.tag.updateMany({
        where: {
          id: item.id,
          householdId: input.householdId,
          deletedAt: null,
        },
        data: {
          sortOrder: item.sortOrder,
        },
      }),
    ),
  );

  return results.reduce((total, result) => total + result.count, 0);
}

export async function findActiveTagsByIds(
  db: DbClient,
  input: HouseholdScopedInput & { ids: string[] },
) {
  return db.tag.findMany({
    where: {
      householdId: input.householdId,
      id: {
        in: input.ids,
      },
      deletedAt: null,
    },
  });
}
