import { Prisma } from "@prisma/client";

import type { DbClient } from "@/server/db/transactions";

export const randomCandidateRecipeArgs =
  Prisma.validator<Prisma.RecipeDefaultArgs>()({
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
            select: {
              id: true,
            },
          },
        },
      },
      versions: {
        select: {
          id: true,
          versionNumber: true,
          versionName: true,
        },
        orderBy: [{ versionNumber: "desc" }],
      },
    },
  });

export const randomSessionDetailArgs =
  Prisma.validator<Prisma.RandomPickSessionDefaultArgs>()({
    include: {
      results: {
        orderBy: [{ sequenceNo: "asc" }, { createdAt: "asc" }],
        include: {
          recipe: {
            include: {
              coverImage: true,
            },
          },
          recipeVersion: {
            include: {
              category: true,
              tagLinks: {
                include: {
                  tag: true,
                },
              },
              recipe: {
                select: {
                  versions: {
                    select: {
                      id: true,
                      versionNumber: true,
                      versionName: true,
                    },
                    orderBy: [{ versionNumber: "desc" }],
                  },
                },
              },
              steps: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

export type RandomCandidateRecipeRecord = Prisma.RecipeGetPayload<
  typeof randomCandidateRecipeArgs
>;
export type RandomSessionDetailRecord = Prisma.RandomPickSessionGetPayload<
  typeof randomSessionDetailArgs
>;
export type RandomSessionResultRecord = RandomSessionDetailRecord["results"][number];

export async function listRandomCandidateRecipes(
  db: DbClient,
  input: {
    householdId: string;
  },
) {
  return db.recipe.findMany({
    where: {
      householdId: input.householdId,
      deletedAt: null,
      currentVersionId: {
        not: null,
      },
    },
    include: randomCandidateRecipeArgs.include,
  });
}

export async function listCurrentWeekPlannedRecipeIds(
  db: DbClient,
  input: {
    householdId: string;
    weekStartDate: Date;
  },
) {
  const items = await db.mealPlanItem.findMany({
    where: {
      mealPlanWeek: {
        householdId: input.householdId,
        weekStartDate: input.weekStartDate,
      },
    },
    select: {
      recipeId: true,
    },
  });

  return Array.from(new Set(items.map((item: { recipeId: string }) => item.recipeId)));
}

export async function findRandomPickSessionById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
  },
) {
  return db.randomPickSession.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
    },
    include: randomSessionDetailArgs.include,
  });
}

export async function createRandomPickSession(
  db: DbClient,
  input: {
    householdId: string;
    mode: string;
    filterSnapshot: Prisma.InputJsonValue;
    createdById: string;
  },
) {
  return db.randomPickSession.create({
    data: {
      householdId: input.householdId,
      mode: input.mode,
      filterSnapshot: input.filterSnapshot,
      createdById: input.createdById,
    },
    include: randomSessionDetailArgs.include,
  });
}

export async function createRandomPickResults(
  db: DbClient,
  input: {
    sessionId: string;
    results: Array<{
      recipeId: string;
      recipeVersionId: string;
      pickedForDate: Date | null;
      sequenceNo: number;
      reasonMeta: Prisma.InputJsonValue | null;
    }>;
  },
) {
  if (!input.results.length) {
    return;
  }

  await db.randomPickResult.createMany({
    data: input.results.map((result) => ({
      sessionId: input.sessionId,
      recipeId: result.recipeId,
      recipeVersionId: result.recipeVersionId,
      pickedForDate: result.pickedForDate,
      sequenceNo: result.sequenceNo,
      reasonMeta: result.reasonMeta ?? Prisma.JsonNull,
    })),
  });
}

export async function findRandomPickResultById(
  db: DbClient,
  input: {
    householdId: string;
    sessionId: string;
    resultId: string;
  },
) {
  return db.randomPickResult.findFirst({
    where: {
      id: input.resultId,
      sessionId: input.sessionId,
      session: {
        householdId: input.householdId,
      },
    },
    include: {
      session: true,
      recipe: {
        include: {
          coverImage: true,
        },
      },
      recipeVersion: {
        include: {
          category: true,
          tagLinks: {
            include: {
              tag: true,
            },
          },
          recipe: {
            select: {
              versions: {
                select: {
                  id: true,
                  versionNumber: true,
                  versionName: true,
                },
                orderBy: [{ versionNumber: "desc" }],
              },
            },
          },
          steps: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
}

export async function updateRandomPickSessionById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
    status?: string;
    resultCount?: number;
  },
) {
  const result = await db.randomPickSession.updateMany({
    where: {
      id: input.id,
      householdId: input.householdId,
    },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.resultCount !== undefined ? { resultCount: input.resultCount } : {}),
    },
  });

  return result.count > 0;
}

export async function updateRandomPickResultDecision(
  db: DbClient,
  input: {
    householdId: string;
    sessionId: string;
    resultId: string;
    decision: string;
    recipeVersionId?: string;
  },
) {
  const result = await db.randomPickResult.updateMany({
    where: {
      id: input.resultId,
      sessionId: input.sessionId,
      session: {
        householdId: input.householdId,
      },
    },
    data: {
      decision: input.decision,
      ...(input.recipeVersionId !== undefined
        ? { recipeVersionId: input.recipeVersionId }
        : {}),
    },
  });

  return result.count > 0;
}

export async function markPendingResultsSkipped(
  db: DbClient,
  input: {
    householdId: string;
    sessionId: string;
  },
) {
  const result = await db.randomPickResult.updateMany({
    where: {
      sessionId: input.sessionId,
      decision: "pending",
      session: {
        householdId: input.householdId,
      },
    },
    data: {
      decision: "skipped",
    },
  });

  return result.count;
}

export async function countRandomPickResults(
  db: DbClient,
  input: {
    sessionId: string;
  },
) {
  return db.randomPickResult.count({
    where: {
      sessionId: input.sessionId,
    },
  });
}

export async function getNextRandomPickSequenceNo(
  db: DbClient,
  input: {
    sessionId: string;
  },
) {
  const aggregate = await db.randomPickResult.aggregate({
    where: {
      sessionId: input.sessionId,
    },
    _max: {
      sequenceNo: true,
    },
  });

  return (aggregate._max.sequenceNo ?? 0) + 1;
}

export async function countPendingRandomPickResults(
  db: DbClient,
  input: {
    sessionId: string;
  },
) {
  return db.randomPickResult.count({
    where: {
      sessionId: input.sessionId,
      decision: "pending",
    },
  });
}

export async function findRecipeVersionForRandomAccept(
  db: DbClient,
  input: {
    householdId: string;
    recipeId: string;
    recipeVersionId: string;
  },
) {
  return db.recipeVersion.findFirst({
    where: {
      id: input.recipeVersionId,
      recipeId: input.recipeId,
      householdId: input.householdId,
    },
    include: {
      category: true,
      tagLinks: {
        include: {
          tag: true,
        },
      },
      recipe: {
        select: {
          versions: {
            select: {
              id: true,
              versionNumber: true,
              versionName: true,
            },
            orderBy: [{ versionNumber: "desc" }],
          },
        },
      },
      steps: {
        select: {
          id: true,
        },
      },
    },
  });
}
