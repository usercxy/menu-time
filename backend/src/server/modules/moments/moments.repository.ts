import { Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/transactions";
import type {
  LatestMomentsInput,
  MomentIdInput,
  MomentListInput,
} from "@/server/modules/moments/moments.types";

const activeMomentWhere = {
  deletedAt: null,
} as const;

export const momentDetailArgs = Prisma.validator<Prisma.MomentDefaultArgs>()({
  include: {
    recipeVersion: {
      select: {
        id: true,
        versionNumber: true,
        versionName: true,
      },
    },
    images: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        mediaAsset: true,
      },
    },
  },
});

export const latestMomentArgs = Prisma.validator<Prisma.MomentDefaultArgs>()({
  include: {
    recipe: {
      include: {
        coverImage: true,
      },
    },
    images: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        mediaAsset: true,
      },
    },
  },
});

export type MomentDetailRecord = Prisma.MomentGetPayload<typeof momentDetailArgs>;
export type LatestMomentRecord = Prisma.MomentGetPayload<typeof latestMomentArgs>;

export async function listRecipeMoments(db: DbClient, input: MomentListInput) {
  return db.moment.findMany({
    where: {
      householdId: input.householdId,
      recipeId: input.recipeId,
      ...activeMomentWhere,
    },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
    include: momentDetailArgs.include,
  });
}

export async function countRecipeMoments(db: DbClient, input: MomentListInput) {
  return db.moment.count({
    where: {
      householdId: input.householdId,
      recipeId: input.recipeId,
      ...activeMomentWhere,
    },
  });
}

export async function findMomentById(db: DbClient, input: MomentIdInput) {
  return db.moment.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
      ...activeMomentWhere,
    },
    include: momentDetailArgs.include,
  });
}

export async function findMomentByIdIncludingDeleted(db: DbClient, input: MomentIdInput) {
  return db.moment.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
    },
    include: momentDetailArgs.include,
  });
}

export async function findMediaAssetsByIds(
  db: DbClient,
  input: {
    householdId: string;
    ids: string[];
  },
) {
  return db.mediaAsset.findMany({
    where: {
      householdId: input.householdId,
      id: {
        in: input.ids,
      },
    },
  });
}

export async function createMomentWithImages(
  db: DbClient,
  input: {
    householdId: string;
    recipeId: string;
    recipeVersionId: string | null;
    occurredOn: Date;
    content: string | null;
    participantsText: string | null;
    tasteRating: number | null;
    difficultyRating: number | null;
    isCoverCandidate: boolean;
    createdById: string;
    imageAssetIds: string[];
  },
) {
  return db.moment.create({
    data: {
      householdId: input.householdId,
      recipeId: input.recipeId,
      recipeVersionId: input.recipeVersionId,
      occurredOn: input.occurredOn,
      content: input.content,
      participantsText: input.participantsText,
      tasteRating: input.tasteRating,
      difficultyRating: input.difficultyRating,
      isCoverCandidate: input.isCoverCandidate,
      createdById: input.createdById,
      images: {
        create: input.imageAssetIds.map((mediaAssetId, index) => ({
          mediaAssetId,
          sortOrder: index,
        })),
      },
    },
    include: momentDetailArgs.include,
  });
}

export async function updateMomentById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
    recipeVersionId?: string | null;
    occurredOn?: Date;
    content?: string | null;
    participantsText?: string | null;
    tasteRating?: number | null;
    difficultyRating?: number | null;
    isCoverCandidate?: boolean;
  },
) {
  const result = await db.moment.updateMany({
    where: {
      id: input.id,
      householdId: input.householdId,
      ...activeMomentWhere,
    },
    data: {
      ...(input.recipeVersionId !== undefined ? { recipeVersionId: input.recipeVersionId } : {}),
      ...(input.occurredOn !== undefined ? { occurredOn: input.occurredOn } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.participantsText !== undefined
        ? { participantsText: input.participantsText }
        : {}),
      ...(input.tasteRating !== undefined ? { tasteRating: input.tasteRating } : {}),
      ...(input.difficultyRating !== undefined
        ? { difficultyRating: input.difficultyRating }
        : {}),
      ...(input.isCoverCandidate !== undefined
        ? { isCoverCandidate: input.isCoverCandidate }
        : {}),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return findMomentById(db, {
    householdId: input.householdId,
    id: input.id,
  });
}

export async function replaceMomentImages(
  db: DbClient,
  input: {
    momentId: string;
    imageAssetIds: string[];
  },
) {
  await db.momentImage.deleteMany({
    where: {
      momentId: input.momentId,
    },
  });

  if (!input.imageAssetIds.length) {
    return;
  }

  await db.momentImage.createMany({
    data: input.imageAssetIds.map((mediaAssetId, index) => ({
      momentId: input.momentId,
      mediaAssetId,
      sortOrder: index,
    })),
  });
}

export async function softDeleteMomentById(db: DbClient, input: MomentIdInput) {
  const result = await db.moment.updateMany({
    where: {
      id: input.id,
      householdId: input.householdId,
      ...activeMomentWhere,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return result.count > 0;
}

export async function aggregateRecipeMomentStats(
  db: DbClient,
  input: {
    householdId: string;
    recipeId: string;
  },
) {
  return db.moment.aggregate({
    where: {
      householdId: input.householdId,
      recipeId: input.recipeId,
      ...activeMomentWhere,
    },
    _count: {
      _all: true,
    },
    _max: {
      createdAt: true,
      occurredOn: true,
    },
  });
}

export async function findLatestRecipeCoverMoment(
  db: DbClient,
  input: {
    householdId: string;
    recipeId: string;
  },
) {
  return db.moment.findFirst({
    where: {
      householdId: input.householdId,
      recipeId: input.recipeId,
      isCoverCandidate: true,
      ...activeMomentWhere,
      images: {
        some: {},
      },
    },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    include: momentDetailArgs.include,
  });
}

export async function listLatestMoments(db: DbClient, input: LatestMomentsInput) {
  return db.moment.findMany({
    where: {
      householdId: input.householdId,
      ...activeMomentWhere,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.limit,
    include: latestMomentArgs.include,
  });
}
