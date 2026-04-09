import type { AuthSession } from "@/server/lib/auth/session";
import { withTransaction } from "@/server/db/transactions";
import { getPrismaClient } from "@/server/db/client";
import { AppError, errorCodes } from "@/server/lib/errors";
import { getLogger } from "@/server/lib/logger";
import { requireRequestHouseholdId } from "@/server/lib/request/context";
import {
  mapCategoryDto,
  mapCategoryListDto,
  mapTagDto,
  mapTagListDto,
} from "@/server/modules/taxonomy/taxonomy.mapper";
import * as taxonomyRepository from "@/server/modules/taxonomy/taxonomy.repository";
import type {
  CategoryCreatePayload,
  CategoryDto,
  CategoryUpdatePayload,
  DeleteTaxonomyResultDto,
  TagCreatePayload,
  TagDto,
  TagUpdatePayload,
  TaxonomyReorderItem,
} from "@/server/modules/taxonomy/taxonomy.types";

const prisma = getPrismaClient();
const logger = getLogger({ module: "taxonomy" });

type SessionInput = {
  session?: Pick<AuthSession, "householdId" | "userId"> | null;
};

type CategoryIdInput = SessionInput & {
  id: string;
};

type TagIdInput = SessionInput & {
  id: string;
};

type CategoryListInput = SessionInput & {
  includeArchived?: boolean;
};

type TagListInput = SessionInput & {
  includeArchived?: boolean;
};

type CategoryCreateServiceInput = SessionInput & {
  data: CategoryCreatePayload;
};

type CategoryUpdateServiceInput = SessionInput & {
  id: string;
  data: CategoryUpdatePayload;
};

type CategoryReorderServiceInput = SessionInput & {
  items: TaxonomyReorderItem[];
};

type TagCreateServiceInput = SessionInput & {
  data: TagCreatePayload;
};

type TagUpdateServiceInput = SessionInput & {
  id: string;
  data: TagUpdatePayload;
};

type TagReorderServiceInput = SessionInput & {
  items: TaxonomyReorderItem[];
};

type HouseholdScopedRecord = {
  householdId: string;
};

function normalizeName(name: string) {
  return name.trim();
}

function normalizeColor(color: string | null | undefined) {
  const normalized = color?.trim();
  return normalized ? normalized : null;
}

function resolveTaxonomyHouseholdId(
  session?: Pick<AuthSession, "householdId"> | null,
) {
  return session?.householdId ?? requireRequestHouseholdId();
}

function assertHouseholdScopedRecord<T extends HouseholdScopedRecord>(
  record: T | null,
  householdId: string,
  resourceName: string,
) {
  if (!record || record.householdId !== householdId) {
    throw new AppError(`${resourceName}不存在`, {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return record;
}

async function assertCategoryNameAvailable(input: {
  householdId: string;
  name: string;
  excludeId?: string;
}) {
  const existing = await taxonomyRepository.findActiveCategoryByName(prisma, input);

  if (existing) {
    throw new AppError("分类名称已存在", {
      code: errorCodes.CONFLICT,
      statusCode: 409,
    });
  }
}

async function assertTagNameAvailable(input: {
  householdId: string;
  name: string;
  excludeId?: string;
}) {
  const existing = await taxonomyRepository.findActiveTagByName(prisma, input);

  if (existing) {
    throw new AppError("标签名称已存在", {
      code: errorCodes.CONFLICT,
      statusCode: 409,
    });
  }
}

export async function listCategories(
  input: CategoryListInput = {},
): Promise<CategoryDto[]> {
  const householdId = resolveTaxonomyHouseholdId(input.session);
  const categories = await taxonomyRepository.listCategories(prisma, {
    householdId,
    includeArchived: input.includeArchived,
  });

  return mapCategoryListDto(categories);
}

export async function createCategory(
  input: CategoryCreateServiceInput,
): Promise<CategoryDto> {
  const householdId = resolveTaxonomyHouseholdId(input.session);
  const name = normalizeName(input.data.name);
  const color = normalizeColor(input.data.color);
  const sortOrder =
    input.data.sortOrder ??
    (await taxonomyRepository.getNextCategorySortOrder(prisma, { householdId }));

  await assertCategoryNameAvailable({
    householdId,
    name,
  });

  const created = await taxonomyRepository.createCategory(prisma, {
    householdId,
    name,
    color,
    sortOrder,
  });

  logger.info(
    {
      householdId,
      categoryId: created.id,
      sortOrder: created.sortOrder,
    },
    "category created",
  );

  return mapCategoryDto(created);
}

export async function updateCategory(
  input: CategoryUpdateServiceInput,
): Promise<CategoryDto> {
  const householdId = resolveTaxonomyHouseholdId(input.session);
  const existing = assertHouseholdScopedRecord(
    await taxonomyRepository.findCategoryById(prisma, {
      householdId,
      id: input.id,
    }),
    householdId,
    "分类",
  );

  const nextName =
    input.data.name !== undefined ? normalizeName(input.data.name) : existing.name;
  const nextColor =
    input.data.color !== undefined ? normalizeColor(input.data.color) : existing.color;

  if (nextName !== existing.name) {
    await assertCategoryNameAvailable({
      householdId,
      name: nextName,
      excludeId: existing.id,
    });
  }

  const updated =
    (await taxonomyRepository.updateCategoryById(prisma, {
      householdId,
      id: existing.id,
      name: input.data.name !== undefined ? nextName : undefined,
      color: input.data.color !== undefined ? nextColor : undefined,
      sortOrder: input.data.sortOrder,
    })) ?? existing;

  logger.info(
    {
      householdId,
      categoryId: existing.id,
    },
    "category updated",
  );

  return mapCategoryDto(updated);
}

export async function deleteCategory(
  input: CategoryIdInput,
): Promise<DeleteTaxonomyResultDto> {
  const householdId = resolveTaxonomyHouseholdId(input.session);

  assertHouseholdScopedRecord(
    await taxonomyRepository.findCategoryById(prisma, {
      householdId,
      id: input.id,
    }),
    householdId,
    "分类",
  );

  await taxonomyRepository.softDeleteCategoryById(prisma, {
    householdId,
    id: input.id,
  });

  logger.info(
    {
      householdId,
      categoryId: input.id,
    },
    "category deleted",
  );

  return {
    deleted: true,
  };
}

export async function reorderCategories(
  input: CategoryReorderServiceInput,
): Promise<CategoryDto[]> {
  const householdId = resolveTaxonomyHouseholdId(input.session);
  const ids = input.items.map((item) => item.id);
  const existing = await taxonomyRepository.findActiveCategoriesByIds(prisma, {
    householdId,
    ids,
  });

  if (existing.length !== ids.length) {
    throw new AppError("存在无效的分类排序项", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  const categories = await withTransaction(async (tx) => {
    await taxonomyRepository.reorderCategories(tx, {
      householdId,
      items: input.items,
    });

    return taxonomyRepository.listCategories(tx, { householdId });
  });

  logger.info(
    {
      householdId,
      count: input.items.length,
    },
    "categories reordered",
  );

  return mapCategoryListDto(categories);
}

export async function listTags(input: TagListInput = {}): Promise<TagDto[]> {
  const householdId = resolveTaxonomyHouseholdId(input.session);
  const tags = await taxonomyRepository.listTags(prisma, {
    householdId,
    includeArchived: input.includeArchived,
  });

  return mapTagListDto(tags);
}

export async function createTag(input: TagCreateServiceInput): Promise<TagDto> {
  const householdId = resolveTaxonomyHouseholdId(input.session);
  const name = normalizeName(input.data.name);
  const sortOrder =
    input.data.sortOrder ??
    (await taxonomyRepository.getNextTagSortOrder(prisma, { householdId }));

  await assertTagNameAvailable({
    householdId,
    name,
  });

  const created = await taxonomyRepository.createTag(prisma, {
    householdId,
    name,
    sortOrder,
  });

  logger.info(
    {
      householdId,
      tagId: created.id,
      sortOrder: created.sortOrder,
    },
    "tag created",
  );

  return mapTagDto(created);
}

export async function updateTag(input: TagUpdateServiceInput): Promise<TagDto> {
  const householdId = resolveTaxonomyHouseholdId(input.session);
  const existing = assertHouseholdScopedRecord(
    await taxonomyRepository.findTagById(prisma, {
      householdId,
      id: input.id,
    }),
    householdId,
    "标签",
  );

  const nextName =
    input.data.name !== undefined ? normalizeName(input.data.name) : existing.name;

  if (nextName !== existing.name) {
    await assertTagNameAvailable({
      householdId,
      name: nextName,
      excludeId: existing.id,
    });
  }

  const updated =
    (await taxonomyRepository.updateTagById(prisma, {
      householdId,
      id: existing.id,
      name: input.data.name !== undefined ? nextName : undefined,
      sortOrder: input.data.sortOrder,
    })) ?? existing;

  logger.info(
    {
      householdId,
      tagId: existing.id,
    },
    "tag updated",
  );

  return mapTagDto(updated);
}

export async function deleteTag(
  input: TagIdInput,
): Promise<DeleteTaxonomyResultDto> {
  const householdId = resolveTaxonomyHouseholdId(input.session);

  assertHouseholdScopedRecord(
    await taxonomyRepository.findTagById(prisma, {
      householdId,
      id: input.id,
    }),
    householdId,
    "标签",
  );

  await taxonomyRepository.softDeleteTagById(prisma, {
    householdId,
    id: input.id,
  });

  logger.info(
    {
      householdId,
      tagId: input.id,
    },
    "tag deleted",
  );

  return {
    deleted: true,
  };
}

export async function reorderTags(
  input: TagReorderServiceInput,
): Promise<TagDto[]> {
  const householdId = resolveTaxonomyHouseholdId(input.session);
  const ids = input.items.map((item) => item.id);
  const existing = await taxonomyRepository.findActiveTagsByIds(prisma, {
    householdId,
    ids,
  });

  if (existing.length !== ids.length) {
    throw new AppError("存在无效的标签排序项", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  const tags = await withTransaction(async (tx) => {
    await taxonomyRepository.reorderTags(tx, {
      householdId,
      items: input.items,
    });

    return taxonomyRepository.listTags(tx, { householdId });
  });

  logger.info(
    {
      householdId,
      count: input.items.length,
    },
    "tags reordered",
  );

  return mapTagListDto(tags);
}
