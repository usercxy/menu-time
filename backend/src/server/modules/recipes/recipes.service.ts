import type { AuthSession } from "@/server/lib/auth/session";
import { getPrismaClient } from "@/server/db/client";
import type { DbClient } from "@/server/db/transactions";
import { AppError, errorCodes } from "@/server/lib/errors";
import { getLogger } from "@/server/lib/logger";
import { requireRequestHouseholdId } from "@/server/lib/request/context";
import {
  buildRecipeVersionDiffSummary,
  type RecipeVersionComparableSnapshot,
} from "@/server/lib/diff";
import {
  mapRecipeCategoryDto,
  mapRecipeDetailDto,
  mapRecipeListDto,
  mapRecipeTagListDto,
  mapRecipeVersionToComparableSnapshot,
  mapRecipeVersionCompareDto,
  mapRecipeVersionDetailDto,
  mapRecipeVersionListDto,
} from "@/server/modules/recipes/recipes.mapper";
import * as recipesRepository from "@/server/modules/recipes/recipes.repository";
import type {
  CreateRecipeVersionResultDto,
  CreateRecipeResultDto,
  DeleteRecipeResultDto,
  RecipeCreatePayload,
  RecipeDetailDto,
  RecipeIdInput,
  RecipeIngredientPayload,
  RecipeIngredientWriteInput,
  RecipeListInput,
  RecipeListResultDto,
  RecipeStepPayload,
  RecipeStepWriteInput,
  RecipeTaxonomyPayload,
  RecipeTaxonomyResolutionResult,
  RecipeUpdatePayload,
  RecipeVersionCompareDto,
  RecipeVersionCreatePayload,
  RecipeVersionDetailDto,
  RecipeVersionIdInput,
  RecipeVersionListResultDto,
  RecipeVersionsListInput,
  RecipeVersionWriteBuildResult,
  SetCurrentRecipeVersionResultDto,
} from "@/server/modules/recipes/recipes.types";
import * as taxonomyRepository from "@/server/modules/taxonomy/taxonomy.repository";
import { withTransaction } from "@/server/db/transactions";

const prisma = getPrismaClient();
const logger = getLogger({ module: "recipes" });

type SessionInput = {
  session?: Pick<AuthSession, "householdId" | "userId"> | null;
};

type RecipeListServiceInput = SessionInput &
  Partial<Omit<RecipeListInput, "householdId">>;

type RecipeVersionsListServiceInput = SessionInput &
  Omit<RecipeVersionsListInput, "householdId">;

type RecipeEntityServiceInput = SessionInput & Omit<RecipeIdInput, "householdId">;

type RecipeVersionEntityServiceInput = SessionInput &
  Omit<RecipeVersionIdInput, "householdId">;

function resolveRecipesHouseholdId(
  session?: Pick<AuthSession, "householdId"> | null,
) {
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

function normalizeTagNames(values: string[] = []) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeRecipeSteps(
  steps: RecipeStepPayload[] = [],
): RecipeStepWriteInput[] {
  return steps
    .map((step, index) => ({
      sortOrder: step.sortOrder ?? index,
      content: step.content.trim(),
    }))
    .filter((step) => step.content.length > 0)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.content.localeCompare(right.content, "zh-CN"),
    )
    .map((step, index) => ({
      sortOrder: index,
      content: step.content,
    }));
}

function normalizeRecipeIngredients(
  ingredients: RecipeIngredientPayload[] = [],
): RecipeIngredientWriteInput[] {
  return ingredients
    .map((ingredient, index) => ({
      sortOrder: ingredient.sortOrder ?? index,
      rawText: ingredient.rawText.trim(),
      normalizedName: normalizeText(ingredient.normalizedName),
      amountText: normalizeText(ingredient.amountText),
      unit: normalizeText(ingredient.unit),
      isSeasoning: ingredient.isSeasoning ?? false,
      parseSource: ingredient.parseSource ?? "manual",
    }))
    .filter((ingredient) => ingredient.rawText.length > 0)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.rawText.localeCompare(right.rawText, "zh-CN"),
    )
    .map((ingredient, index) => ({
      ...ingredient,
      sortOrder: index,
    }));
}

function buildPageResult<T>(items: T[], page: number, pageSize: number, total: number) {
  return {
    items,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

function assertHouseholdScopedRecord<
  T extends {
    householdId: string;
  },
>(record: T | null, householdId: string, resourceName: string) {
  if (!record || record.householdId !== householdId) {
    throw new AppError(`${resourceName}不存在`, {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return record;
}

async function assertRecipeExists(db: DbClient, input: RecipeIdInput) {
  const recipe = await recipesRepository.findRecipeById(db, input);
  return assertHouseholdScopedRecord(recipe, input.householdId, "菜谱");
}

async function resolveCategoryReference(
  db: DbClient,
  input: {
    householdId: string;
    categoryId?: string;
    newCategoryName?: string;
  },
) {
  if (input.categoryId) {
    const category = await taxonomyRepository.findCategoryById(db, {
      householdId: input.householdId,
      id: input.categoryId,
    });

    if (!category) {
      throw new AppError("分类不存在", {
        code: errorCodes.NOT_FOUND,
        statusCode: 404,
      });
    }

    return mapRecipeCategoryDto(category);
  }

  const categoryName = normalizeText(input.newCategoryName);

  if (!categoryName) {
    return null;
  }

  const existing = await taxonomyRepository.findActiveCategoryByName(db, {
    householdId: input.householdId,
    name: categoryName,
  });

  if (existing) {
    return mapRecipeCategoryDto(existing);
  }

  const sortOrder = await taxonomyRepository.getNextCategorySortOrder(db, {
    householdId: input.householdId,
  });

  const created = await taxonomyRepository.createCategory(db, {
    householdId: input.householdId,
    name: categoryName,
    sortOrder,
  });

  logger.info(
    {
      householdId: input.householdId,
      categoryId: created.id,
    },
    "category created from recipes helper",
  );

  return mapRecipeCategoryDto(created);
}

async function resolveTagReferences(
  db: DbClient,
  input: {
    householdId: string;
    tagIds?: string[];
    newTagNames?: string[];
  },
) {
  const resolvedTags = new Map<string, { id: string; name: string; sortOrder: number }>();

  if (input.tagIds?.length) {
    const existingTags = await taxonomyRepository.findActiveTagsByIds(db, {
      householdId: input.householdId,
      ids: input.tagIds,
    });

    if (existingTags.length !== input.tagIds.length) {
      throw new AppError("存在无效的标签", {
        code: errorCodes.NOT_FOUND,
        statusCode: 404,
      });
    }

    existingTags.forEach((tag) => {
      resolvedTags.set(tag.id, {
        id: tag.id,
        name: tag.name,
        sortOrder: tag.sortOrder,
      });
    });
  }

  const normalizedNewTagNames = normalizeTagNames(input.newTagNames);

  if (normalizedNewTagNames.length === 0) {
    return mapRecipeTagListDto([...resolvedTags.values()]);
  }

  let nextSortOrder = await taxonomyRepository.getNextTagSortOrder(db, {
    householdId: input.householdId,
  });

  for (const tagName of normalizedNewTagNames) {
    const existing = await taxonomyRepository.findActiveTagByName(db, {
      householdId: input.householdId,
      name: tagName,
    });

    if (existing) {
      resolvedTags.set(existing.id, {
        id: existing.id,
        name: existing.name,
        sortOrder: existing.sortOrder,
      });
      continue;
    }

    const created = await taxonomyRepository.createTag(db, {
      householdId: input.householdId,
      name: tagName,
      sortOrder: nextSortOrder,
    });
    nextSortOrder += 1;

    logger.info(
      {
        householdId: input.householdId,
        tagId: created.id,
      },
      "tag created from recipes helper",
    );

    resolvedTags.set(created.id, {
      id: created.id,
      name: created.name,
      sortOrder: created.sortOrder,
    });
  }

  return mapRecipeTagListDto([...resolvedTags.values()]);
}

export async function resolveRecipeTaxonomyReferences(
  input: SessionInput &
    RecipeTaxonomyPayload & {
      db?: DbClient;
    },
): Promise<RecipeTaxonomyResolutionResult> {
  const householdId = resolveRecipesHouseholdId(input.session);
  const db = input.db ?? prisma;
  const [category, tagDtos] = await Promise.all([
    resolveCategoryReference(db, {
      householdId,
      categoryId: input.categoryId,
      newCategoryName: input.newCategoryName,
    }),
    resolveTagReferences(db, {
      householdId,
      tagIds: input.tagIds,
      newTagNames: input.newTagNames,
    }),
  ]);

  return {
    category,
    tagIds: tagDtos.map((tag) => tag.id),
    tagDtos,
  };
}

export function buildRecipeVersionComparableSnapshot(input: {
  ingredientsText?: string | null;
  steps?: RecipeStepWriteInput[];
  tagDtos?: { id: string; name: string }[];
}): RecipeVersionComparableSnapshot {
  return {
    ingredientsText: normalizeText(input.ingredientsText),
    steps: input.steps ?? [],
    tags: input.tagDtos ?? [],
  };
}

function mergeRecipeVersionCreateData(input: {
  sourceVersion: recipesRepository.RecipeVersionDetailRecord;
  data: RecipeVersionCreatePayload;
}): Required<
  Pick<
    RecipeVersionCreatePayload,
    "ingredientsText" | "ingredients" | "steps" | "tips" | "isMajor"
  >
> &
  Pick<RecipeVersionCreatePayload, "versionName"> {
  return {
    versionName:
      input.data.versionName !== undefined
        ? input.data.versionName
        : input.sourceVersion.versionName,
    ingredientsText:
      input.data.ingredientsText !== undefined
        ? input.data.ingredientsText
        : input.sourceVersion.ingredientsText,
    ingredients:
      input.data.ingredients !== undefined
        ? input.data.ingredients
        : input.sourceVersion.ingredients.map((ingredient) => ({
            sortOrder: ingredient.sortOrder,
            rawText: ingredient.rawText,
            normalizedName: ingredient.normalizedName,
            amountText: ingredient.amountText,
            unit: ingredient.unit,
            isSeasoning: ingredient.isSeasoning,
            parseSource: ingredient.parseSource as "manual" | "rule",
          })),
    steps:
      input.data.steps !== undefined
        ? input.data.steps
        : input.sourceVersion.steps.map((step) => ({
            sortOrder: step.sortOrder,
            content: step.content,
          })),
    tips:
      input.data.tips !== undefined ? input.data.tips : input.sourceVersion.tips,
    isMajor:
      input.data.isMajor !== undefined ? input.data.isMajor : input.sourceVersion.isMajor,
  };
}

function hasExplicitTaxonomyInput(input: RecipeTaxonomyPayload) {
  return (
    input.categoryId !== undefined ||
    input.newCategoryName !== undefined ||
    input.tagIds !== undefined ||
    input.newTagNames !== undefined
  );
}

export function buildRecipeVersionWriteInput(input: {
  session?: Pick<AuthSession, "householdId" | "userId"> | null;
  recipeId: string;
  versionNumber: number;
  createdById: string;
  data: Pick<
    RecipeCreatePayload | RecipeVersionCreatePayload,
    "versionName" | "ingredientsText" | "ingredients" | "steps" | "tips" | "isMajor"
  >;
  taxonomy: RecipeTaxonomyResolutionResult;
  baseSnapshot?: RecipeVersionComparableSnapshot | null;
  sourceVersionId?: string | null;
}): RecipeVersionWriteBuildResult {
  const householdId = resolveRecipesHouseholdId(input.session);
  const steps = normalizeRecipeSteps(input.data.steps);
  const ingredients = normalizeRecipeIngredients(input.data.ingredients);
  const comparableSnapshot = buildRecipeVersionComparableSnapshot({
    ingredientsText: input.data.ingredientsText,
    steps,
    tagDtos: input.taxonomy.tagDtos,
  });
  const diffSummaryJson = input.baseSnapshot
    ? buildRecipeVersionDiffSummary({
        base: input.baseSnapshot,
        target: comparableSnapshot,
      })
    : null;

  return {
    comparableSnapshot,
    diffSummaryJson,
    versionWriteInput: {
      householdId,
      recipeId: input.recipeId,
      versionNumber: input.versionNumber,
      versionName: normalizeText(input.data.versionName),
      categoryId: input.taxonomy.category?.id ?? null,
      ingredientsText: normalizeText(input.data.ingredientsText),
      tips: normalizeText(input.data.tips),
      diffSummaryText: diffSummaryJson?.summary ?? null,
      diffSummaryJson,
      sourceVersionId: input.sourceVersionId ?? null,
      isMajor: input.data.isMajor ?? false,
      createdById: input.createdById,
      steps,
      ingredients,
      tagIds: input.taxonomy.tagIds,
    },
  };
}

export async function listRecipes(
  input: RecipeListServiceInput = {},
): Promise<RecipeListResultDto> {
  const householdId = resolveRecipesHouseholdId(input.session);
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const normalizedInput = {
    householdId,
    page,
    pageSize,
    keyword: normalizeText(input.keyword) ?? undefined,
    categoryId: input.categoryId,
    tagIds: input.tagIds,
    sortBy: input.sortBy ?? "updatedAt",
  };
  const records = await recipesRepository.listRecipes(prisma, normalizedInput);
  const total = await recipesRepository.countRecipes(prisma, normalizedInput);

  return buildPageResult(mapRecipeListDto(records), page, pageSize, total);
}

export async function getRecipeDetail(
  input: RecipeEntityServiceInput,
): Promise<RecipeDetailDto> {
  const householdId = resolveRecipesHouseholdId(input.session);
  const record = await recipesRepository.findRecipeDetailById(prisma, {
    householdId,
    id: input.id,
  });

  return mapRecipeDetailDto(assertHouseholdScopedRecord(record, householdId, "菜谱"));
}

export async function listRecipeVersions(
  input: RecipeVersionsListServiceInput,
): Promise<RecipeVersionListResultDto> {
  const householdId = resolveRecipesHouseholdId(input.session);

  await assertRecipeExists(prisma, {
    householdId,
    id: input.recipeId,
  });

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const normalizedInput = {
    householdId,
    recipeId: input.recipeId,
    page,
    pageSize,
  };
  const records = await recipesRepository.listRecipeVersions(prisma, normalizedInput);
  const total = await recipesRepository.countRecipeVersions(prisma, normalizedInput);

  return buildPageResult(mapRecipeVersionListDto(records), page, pageSize, total);
}

export async function getRecipeVersionDetail(
  input: RecipeVersionEntityServiceInput,
): Promise<RecipeVersionDetailDto> {
  const householdId = resolveRecipesHouseholdId(input.session);
  const record = await recipesRepository.findRecipeVersionById(prisma, {
    householdId,
    recipeId: input.recipeId,
    versionId: input.versionId,
  });

  if (!record) {
    throw new AppError("版本不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return mapRecipeVersionDetailDto(record);
}

export async function compareRecipeVersions(
  input: SessionInput & {
    recipeId: string;
    baseVersionNumber: number;
    targetVersionNumber: number;
  },
): Promise<RecipeVersionCompareDto> {
  const householdId = resolveRecipesHouseholdId(input.session);

  await assertRecipeExists(prisma, {
    householdId,
    id: input.recipeId,
  });

  const [baseVersion, targetVersion] = await Promise.all([
    recipesRepository.findRecipeVersionByNumber(prisma, {
      householdId,
      recipeId: input.recipeId,
      versionNumber: input.baseVersionNumber,
    }),
    recipesRepository.findRecipeVersionByNumber(prisma, {
      householdId,
      recipeId: input.recipeId,
      versionNumber: input.targetVersionNumber,
    }),
  ]);

  if (!baseVersion || !targetVersion) {
    throw new AppError("对比版本不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  const summaryJson = buildRecipeVersionDiffSummary({
    base: mapRecipeVersionToComparableSnapshot(baseVersion),
    target: mapRecipeVersionToComparableSnapshot(targetVersion),
  });

  return mapRecipeVersionCompareDto({
    baseVersion,
    targetVersion,
    summaryText: summaryJson.summary,
    summaryJson,
  });
}

export async function createRecipe(
  input: SessionInput & {
    data: RecipeCreatePayload;
  },
): Promise<CreateRecipeResultDto> {
  const householdId = resolveRecipesHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);
  const name = input.data.name.trim();
  const slug = normalizeText(input.data.slug);

  if (slug) {
    const existingRecipe = await recipesRepository.findActiveRecipeBySlug(prisma, {
      householdId,
      slug,
    });

    if (existingRecipe) {
      throw new AppError("slug 已存在", {
        code: errorCodes.CONFLICT,
        statusCode: 409,
      });
    }
  }

  const result = await withTransaction(async (tx) => {
    const taxonomy = await resolveRecipeTaxonomyReferences({
      session: input.session,
      db: tx,
      categoryId: input.data.categoryId,
      newCategoryName: input.data.newCategoryName,
      tagIds: input.data.tagIds,
      newTagNames: input.data.newTagNames,
    });

    const recipe = await recipesRepository.createRecipe(tx, {
      householdId,
      name,
      slug,
      createdById,
    });

    const versionBuild = buildRecipeVersionWriteInput({
      session: input.session,
      recipeId: recipe.id,
      versionNumber: 1,
      createdById,
      data: input.data,
      taxonomy,
    });

    const currentVersion = await recipesRepository.createRecipeVersionWithRelations(
      tx,
      versionBuild.versionWriteInput,
    );

    await recipesRepository.updateRecipeById(tx, {
      householdId,
      id: recipe.id,
      currentVersionId: currentVersion.id,
      versionCount: 1,
    });

    return {
      recipeId: recipe.id,
      currentVersionId: currentVersion.id,
      versionNumber: currentVersion.versionNumber,
    };
  });

  logger.info(
    {
      householdId,
      userId: createdById,
      recipeId: result.recipeId,
      currentVersionId: result.currentVersionId,
    },
    "recipe created with initial version",
  );

  return result;
}

export async function createRecipeVersion(
  input: SessionInput & {
    recipeId: string;
    data: RecipeVersionCreatePayload;
  },
): Promise<CreateRecipeVersionResultDto> {
  const householdId = resolveRecipesHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);

  const recipe = await assertRecipeExists(prisma, {
    householdId,
    id: input.recipeId,
  });

  const sourceVersionId = input.data.sourceVersionId ?? recipe.currentVersionId;

  if (!sourceVersionId) {
    throw new AppError("当前菜谱不存在可复制的来源版本", {
      code: errorCodes.BUSINESS_RULE_VIOLATION,
      statusCode: 422,
    });
  }

  const sourceVersion = await recipesRepository.findRecipeVersionById(prisma, {
    householdId,
    recipeId: input.recipeId,
    versionId: sourceVersionId,
  });

  if (!sourceVersion) {
    throw new AppError("来源版本不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  const mergedData = mergeRecipeVersionCreateData({
    sourceVersion,
    data: input.data,
  });

  const result = await withTransaction(async (tx) => {
    const taxonomy = hasExplicitTaxonomyInput(input.data)
      ? await resolveRecipeTaxonomyReferences({
          session: input.session,
          db: tx,
          categoryId: input.data.categoryId,
          newCategoryName: input.data.newCategoryName,
          tagIds: input.data.tagIds,
          newTagNames: input.data.newTagNames,
        })
      : {
          category: mapRecipeCategoryDto(sourceVersion.category),
          tagIds: sourceVersion.tagLinks.map((tagLink) => tagLink.tag.id),
          tagDtos: mapRecipeTagListDto(sourceVersion.tagLinks.map((tagLink) => tagLink.tag)),
        };

    const versionNumber = await recipesRepository.getNextRecipeVersionNumber(tx, {
      householdId,
      recipeId: input.recipeId,
    });

    const versionBuild = buildRecipeVersionWriteInput({
      session: input.session,
      recipeId: input.recipeId,
      versionNumber,
      createdById,
      data: mergedData,
      taxonomy,
      baseSnapshot: mapRecipeVersionToComparableSnapshot(sourceVersion),
      sourceVersionId: sourceVersion.id,
    });

    const createdVersion = await recipesRepository.createRecipeVersionWithRelations(
      tx,
      versionBuild.versionWriteInput,
    );

    await recipesRepository.updateRecipeById(tx, {
      householdId,
      id: input.recipeId,
      currentVersionId: createdVersion.id,
      versionCount: versionNumber,
    });

    return {
      versionId: createdVersion.id,
      versionNumber: createdVersion.versionNumber,
      diffSummaryText: createdVersion.diffSummaryText,
    };
  });

  logger.info(
    {
      householdId,
      userId: createdById,
      recipeId: input.recipeId,
      versionId: result.versionId,
      versionNumber: result.versionNumber,
      sourceVersionId,
    },
    "recipe version created",
  );

  return result;
}

export async function updateRecipe(
  input: SessionInput & {
    id: string;
    data: RecipeUpdatePayload;
  },
): Promise<RecipeDetailDto> {
  const householdId = resolveRecipesHouseholdId(input.session);

  const recipe = await assertRecipeExists(prisma, {
    householdId,
    id: input.id,
  });

  const nextSlug =
    input.data.slug !== undefined ? normalizeText(input.data.slug) : recipe.slug;

  if (nextSlug && nextSlug !== recipe.slug) {
    const existingRecipe = await recipesRepository.findActiveRecipeBySlug(prisma, {
      householdId,
      slug: nextSlug,
      excludeId: recipe.id,
    });

    if (existingRecipe) {
      throw new AppError("slug 已存在", {
        code: errorCodes.CONFLICT,
        statusCode: 409,
      });
    }
  }

  if (input.data.coverImageId) {
    const coverImage = await recipesRepository.findMediaAssetById(prisma, {
      householdId,
      id: input.data.coverImageId,
    });

    if (!coverImage) {
      throw new AppError("封面资源不存在", {
        code: errorCodes.NOT_FOUND,
        statusCode: 404,
      });
    }
  }

  const updated = await recipesRepository.updateRecipeById(prisma, {
    householdId,
    id: input.id,
    name: input.data.name?.trim(),
    slug: input.data.slug !== undefined ? nextSlug : undefined,
    coverImageId: input.data.coverImageId,
    coverSource: input.data.coverSource,
    status: input.data.status,
  });

  if (!updated) {
    throw new AppError("菜谱不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  logger.info(
    {
      householdId,
      recipeId: input.id,
    },
    "recipe updated",
  );

  return getRecipeDetail({
    session: input.session,
    id: input.id,
  });
}

export async function deleteRecipe(
  input: SessionInput & {
    id: string;
  },
): Promise<DeleteRecipeResultDto> {
  const householdId = resolveRecipesHouseholdId(input.session);

  await assertRecipeExists(prisma, {
    householdId,
    id: input.id,
  });

  await recipesRepository.softDeleteRecipeById(prisma, {
    householdId,
    id: input.id,
  });

  logger.info(
    {
      householdId,
      recipeId: input.id,
    },
    "recipe soft deleted",
  );

  return {
    deleted: true,
  };
}

export async function setCurrentRecipeVersion(
  input: SessionInput & {
    recipeId: string;
    versionId: string;
  },
): Promise<SetCurrentRecipeVersionResultDto> {
  const householdId = resolveRecipesHouseholdId(input.session);

  await assertRecipeExists(prisma, {
    householdId,
    id: input.recipeId,
  });

  const version = await recipesRepository.findRecipeVersionById(prisma, {
    householdId,
    recipeId: input.recipeId,
    versionId: input.versionId,
  });

  if (!version) {
    throw new AppError("版本不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  await recipesRepository.updateRecipeById(prisma, {
    householdId,
    id: input.recipeId,
    currentVersionId: version.id,
  });

  logger.info(
    {
      householdId,
      recipeId: input.recipeId,
      versionId: version.id,
    },
    "recipe current version switched",
  );

  return {
    recipeId: input.recipeId,
    currentVersionId: version.id,
  };
}
