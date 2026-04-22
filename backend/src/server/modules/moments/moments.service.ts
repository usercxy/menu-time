import type { AuthSession } from "@/server/lib/auth/session";
import { getPrismaClient } from "@/server/db/client";
import { withTransaction, type DbClient } from "@/server/db/transactions";
import { AppError, errorCodes } from "@/server/lib/errors";
import { getJobQueue } from "@/server/lib/jobs/client";
import { jobNames } from "@/server/lib/jobs/job-names";
import { getLogger } from "@/server/lib/logger";
import { requireRequestHouseholdId } from "@/server/lib/request/context";
import { mapLatestMomentsDto, mapMomentListDto } from "@/server/modules/moments/moments.mapper";
import * as momentsRepository from "@/server/modules/moments/moments.repository";
import type {
  DeleteMomentResultDto,
  LatestMomentsResultDto,
  MomentCreatePayload,
  MomentIdInput,
  MomentListResultDto,
  MomentMutationResultDto,
  MomentUpdatePayload,
} from "@/server/modules/moments/moments.types";
import * as recipesRepository from "@/server/modules/recipes/recipes.repository";

const prisma = getPrismaClient();
const logger = getLogger({ module: "moments" });

type SessionInput = {
  session?: Pick<AuthSession, "householdId" | "userId"> | null;
};

type RecipeMomentListServiceInput = SessionInput & {
  recipeId: string;
  page: number;
  pageSize: number;
};

type CreateMomentServiceInput = SessionInput & {
  recipeId: string;
  data: MomentCreatePayload;
};

type UpdateMomentServiceInput = SessionInput & {
  id: string;
  data: MomentUpdatePayload;
};

type DeleteMomentServiceInput = SessionInput & {
  id: string;
};

type LatestMomentsServiceInput = SessionInput & {
  limit: number;
};

export type RecipeCoverRefreshPayload = {
  householdId: string;
  recipeId: string;
};

function resolveMomentsHouseholdId(session?: Pick<AuthSession, "householdId"> | null) {
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

function parseOccurredOn(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("occurredOn 不是合法日期", {
      code: errorCodes.VALIDATION_ERROR,
      statusCode: 400,
    });
  }

  return parsed;
}

async function assertRecipeExists(db: DbClient, input: {
  householdId: string;
  recipeId: string;
}) {
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

  return recipe;
}

async function assertMomentExists(db: DbClient, input: MomentIdInput) {
  const moment = await momentsRepository.findMomentById(db, input);

  if (!moment) {
    throw new AppError("时光记录不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return moment;
}

async function resolveRecipeVersionId(
  db: DbClient,
  input: {
    householdId: string;
    recipeId: string;
    recipeVersionId?: string | null;
  },
) {
  if (input.recipeVersionId === undefined) {
    return undefined;
  }

  if (input.recipeVersionId === null) {
    return null;
  }

  const recipeVersion = await recipesRepository.findRecipeVersionById(db, {
    householdId: input.householdId,
    recipeId: input.recipeId,
    versionId: input.recipeVersionId,
  });

  if (!recipeVersion) {
    throw new AppError("菜谱版本不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return recipeVersion.id;
}

async function assertImageAssetsOwned(db: DbClient, input: {
  householdId: string;
  imageAssetIds: string[];
}) {
  if (!input.imageAssetIds.length) {
    return [];
  }

  const assets = await momentsRepository.findMediaAssetsByIds(db, {
    householdId: input.householdId,
    ids: input.imageAssetIds,
  });

  if (assets.length !== input.imageAssetIds.length) {
    throw new AppError("存在无效的图片资源", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return assets;
}

async function syncRecipeMomentSummary(db: DbClient, input: {
  householdId: string;
  recipeId: string;
}) {
  const stats = await momentsRepository.aggregateRecipeMomentStats(db, input);

  await recipesRepository.updateRecipeById(db, {
    householdId: input.householdId,
    id: input.recipeId,
    momentCount: stats._count._all,
    latestMomentAt: stats._max.createdAt ?? null,
    latestCookedAt: stats._max.occurredOn ?? null,
  });
}

export async function refreshRecipeCoverFromMoments(
  input: RecipeCoverRefreshPayload,
) {
  const recipe = await recipesRepository.findRecipeById(prisma, {
    householdId: input.householdId,
    id: input.recipeId,
    includeArchived: true,
  });

  if (!recipe || recipe.deletedAt) {
    return;
  }

  if (recipe.coverSource === "custom") {
    return;
  }

  const latestMoment = await momentsRepository.findLatestRecipeCoverMoment(prisma, input);
  const latestImage = latestMoment?.images[0];

  if (latestImage) {
    if (
      recipe.coverImageId !== latestImage.mediaAssetId ||
      recipe.coverSource !== "moment_latest"
    ) {
      await recipesRepository.updateRecipeById(prisma, {
        householdId: input.householdId,
        id: input.recipeId,
        coverImageId: latestImage.mediaAssetId,
        coverSource: "moment_latest",
      });
    }

    return;
  }

  if (recipe.coverSource === "moment_latest" || recipe.coverImageId) {
    await recipesRepository.updateRecipeById(prisma, {
      householdId: input.householdId,
      id: input.recipeId,
      coverImageId: null,
      coverSource: "none",
    });
  }
}

async function enqueueRecipeCoverRefresh(input: RecipeCoverRefreshPayload) {
  const boss = await getJobQueue();

  if (boss) {
    await boss.send(jobNames.recipeCoverRefresh, input);
    return;
  }

  void refreshRecipeCoverFromMoments(input).catch((error) => {
    logger.error(
      {
        err: error,
        householdId: input.householdId,
        recipeId: input.recipeId,
      },
      "recipe cover refresh fallback failed",
    );
  });
}

export async function listRecipeMoments(
  input: RecipeMomentListServiceInput,
): Promise<MomentListResultDto> {
  const householdId = resolveMomentsHouseholdId(input.session);

  await assertRecipeExists(prisma, {
    householdId,
    recipeId: input.recipeId,
  });

  const [records, total] = await Promise.all([
    momentsRepository.listRecipeMoments(prisma, {
      householdId,
      recipeId: input.recipeId,
      page: input.page,
      pageSize: input.pageSize,
    }),
    momentsRepository.countRecipeMoments(prisma, {
      householdId,
      recipeId: input.recipeId,
      page: input.page,
      pageSize: input.pageSize,
    }),
  ]);

  return mapMomentListDto({
    records,
    page: input.page,
    pageSize: input.pageSize,
    total,
  });
}

export async function createMoment(
  input: CreateMomentServiceInput,
): Promise<MomentMutationResultDto> {
  const householdId = resolveMomentsHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);
  const imageAssetIds = input.data.imageAssetIds ?? [];

  const createdMoment = await withTransaction(async (tx) => {
    await assertRecipeExists(tx, {
      householdId,
      recipeId: input.recipeId,
    });

    const recipeVersionId = await resolveRecipeVersionId(tx, {
      householdId,
      recipeId: input.recipeId,
      recipeVersionId: input.data.recipeVersionId,
    });

    await assertImageAssetsOwned(tx, {
      householdId,
      imageAssetIds,
    });

    const created = await momentsRepository.createMomentWithImages(tx, {
      householdId,
      recipeId: input.recipeId,
      recipeVersionId: recipeVersionId ?? null,
      occurredOn: parseOccurredOn(input.data.occurredOn),
      content: normalizeText(input.data.content),
      participantsText: normalizeText(input.data.participantsText),
      tasteRating: input.data.tasteRating ?? null,
      difficultyRating: input.data.difficultyRating ?? null,
      isCoverCandidate: input.data.isCoverCandidate ?? true,
      createdById,
      imageAssetIds,
    });

    await syncRecipeMomentSummary(tx, {
      householdId,
      recipeId: input.recipeId,
    });

    return created;
  });

  await enqueueRecipeCoverRefresh({
    householdId,
    recipeId: input.recipeId,
  });

  logger.info(
    {
      householdId,
      recipeId: input.recipeId,
      momentId: createdMoment.id,
    },
    "moment created",
  );

  return {
    id: createdMoment.id,
  };
}

export async function updateMoment(
  input: UpdateMomentServiceInput,
): Promise<MomentMutationResultDto> {
  const householdId = resolveMomentsHouseholdId(input.session);

  const moment = await withTransaction(async (tx) => {
    const existing = await assertMomentExists(tx, {
      householdId,
      id: input.id,
    });

    const recipeVersionId = await resolveRecipeVersionId(tx, {
      householdId,
      recipeId: existing.recipeId,
      recipeVersionId: input.data.recipeVersionId,
    });

    if (input.data.imageAssetIds !== undefined) {
      await assertImageAssetsOwned(tx, {
        householdId,
        imageAssetIds: input.data.imageAssetIds,
      });
    }

    const updated = await momentsRepository.updateMomentById(tx, {
      householdId,
      id: input.id,
      ...(recipeVersionId !== undefined ? { recipeVersionId } : {}),
      ...(input.data.occurredOn !== undefined
        ? { occurredOn: parseOccurredOn(input.data.occurredOn) }
        : {}),
      ...(input.data.content !== undefined
        ? { content: normalizeText(input.data.content) }
        : {}),
      ...(input.data.participantsText !== undefined
        ? { participantsText: normalizeText(input.data.participantsText) }
        : {}),
      ...(input.data.tasteRating !== undefined
        ? { tasteRating: input.data.tasteRating }
        : {}),
      ...(input.data.difficultyRating !== undefined
        ? { difficultyRating: input.data.difficultyRating }
        : {}),
      ...(input.data.isCoverCandidate !== undefined
        ? { isCoverCandidate: input.data.isCoverCandidate }
        : {}),
    });

    if (!updated) {
      throw new AppError("时光记录不存在", {
        code: errorCodes.NOT_FOUND,
        statusCode: 404,
      });
    }

    if (input.data.imageAssetIds !== undefined) {
      await momentsRepository.replaceMomentImages(tx, {
        momentId: input.id,
        imageAssetIds: input.data.imageAssetIds,
      });
    }

    await syncRecipeMomentSummary(tx, {
      householdId,
      recipeId: existing.recipeId,
    });

    return {
      id: updated.id,
      recipeId: existing.recipeId,
    };
  });

  await enqueueRecipeCoverRefresh({
    householdId,
    recipeId: moment.recipeId,
  });

  logger.info(
    {
      householdId,
      recipeId: moment.recipeId,
      momentId: moment.id,
    },
    "moment updated",
  );

  return {
    id: moment.id,
  };
}

export async function deleteMoment(
  input: DeleteMomentServiceInput,
): Promise<DeleteMomentResultDto> {
  const householdId = resolveMomentsHouseholdId(input.session);

  const deleted = await withTransaction(async (tx) => {
    const existing = await assertMomentExists(tx, {
      householdId,
      id: input.id,
    });

    await momentsRepository.softDeleteMomentById(tx, {
      householdId,
      id: input.id,
    });

    await syncRecipeMomentSummary(tx, {
      householdId,
      recipeId: existing.recipeId,
    });

    return existing;
  });

  await enqueueRecipeCoverRefresh({
    householdId,
    recipeId: deleted.recipeId,
  });

  logger.info(
    {
      householdId,
      recipeId: deleted.recipeId,
      momentId: deleted.id,
    },
    "moment deleted",
  );

  return {
    deleted: true,
  };
}

export async function listLatestMoments(
  input: LatestMomentsServiceInput,
): Promise<LatestMomentsResultDto> {
  const householdId = resolveMomentsHouseholdId(input.session);
  const records = await momentsRepository.listLatestMoments(prisma, {
    householdId,
    limit: input.limit,
  });

  return mapLatestMomentsDto(records);
}
