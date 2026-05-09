import type { Prisma } from "@prisma/client";

import { getPrismaClient } from "@/server/db/client";
import { withTransaction, type DbClient } from "@/server/db/transactions";
import type { AuthSession } from "@/server/lib/auth/session";
import { AppError, errorCodes } from "@/server/lib/errors";
import { getLogger } from "@/server/lib/logger";
import { requireRequestHouseholdId } from "@/server/lib/request/context";
import { mapRandomPickResultDto, mapRandomPickSessionCreateResultDto, mapRandomPickSessionDetailDto } from "@/server/modules/random/random.mapper";
import * as randomRepository from "@/server/modules/random/random.repository";
import type {
  RandomPickFilterSnapshotDto,
  RandomPickMode,
  RandomPickRedrawResultDto,
  RandomPickResultAcceptPayload,
  RandomPickResultAcceptResultDto,
  RandomPickResultSkipResultDto,
  RandomPickSessionCreatePayload,
  RandomPickSessionCreateResultDto,
  RandomPickSessionDetailDto,
} from "@/server/modules/random/random.types";
import * as plansRepository from "@/server/modules/plans/plans.repository";

const prisma = getPrismaClient();
const logger = getLogger({ module: "random" });

type SessionInput = {
  session?: Pick<AuthSession, "householdId" | "userId"> | null;
};

type CreateRandomPickSessionServiceInput = SessionInput & {
  data: RandomPickSessionCreatePayload;
};

type RandomPickSessionIdServiceInput = SessionInput & {
  id: string;
};

type RandomPickResultIdServiceInput = SessionInput & {
  id: string;
  resultId: string;
};

type AcceptRandomPickResultServiceInput = RandomPickResultIdServiceInput & {
  data: RandomPickResultAcceptPayload;
};

type CandidateRecord = randomRepository.RandomCandidateRecipeRecord & {
  currentVersion: NonNullable<randomRepository.RandomCandidateRecipeRecord["currentVersion"]>;
};

type ScoredCandidate = {
  recipe: CandidateRecord;
  difficultyRating: number;
  categoryName: string | null;
  tagNames: string[];
  preferredTagMatches: string[];
  categoryMatch: boolean;
  tagMatch: boolean;
  strictEligible: boolean;
  similarEligible: boolean;
  generalEligible: boolean;
  classification: "soup" | "vegetable" | "other";
  weight: number;
};

type BuiltResult = {
  recipe: CandidateRecord;
  difficultyRating: number;
  pickedForDate: Date | null;
  reasonMeta: Record<string, unknown>;
  usedTier: "strict" | "similar" | "general";
};

function resolveRandomHouseholdId(session?: Pick<AuthSession, "householdId"> | null) {
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
  return getWeekStartDateForDate(utc);
}

function getWeekStartDateForDate(value: Date) {
  const utc = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  const day = utc.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diffToMonday);
  return utc;
}

function assertWeekStartDateIsMonday(value: Date) {
  if (value.getUTCDay() !== 1) {
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

function normalizeStringList(values?: string[]) {
  if (!values?.length) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeIdList(values?: string[]) {
  if (!values?.length) {
    return [];
  }

  return Array.from(new Set(values));
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeFilterSnapshot(input: RandomPickSessionCreatePayload): RandomPickFilterSnapshotDto {
  const weekStartDate = input.weekStartDate
    ? formatDateOnly(parseDateOnly(input.weekStartDate, "weekStartDate"))
    : null;

  if (weekStartDate) {
    assertWeekStartDateIsMonday(parseDateOnly(weekStartDate, "weekStartDate"));
  }

  return {
    weekStartDate,
    categoryIds: normalizeIdList(input.filters?.categoryIds),
    tagIds: normalizeIdList(input.filters?.tagIds),
    maxDifficulty: input.filters?.maxDifficulty ?? null,
    excludeRecentDays: input.filters?.excludeRecentDays ?? null,
    excludeCurrentWeekPlanned: input.filters?.excludeCurrentWeekPlanned ?? false,
    preferredMemberTags: normalizeStringList(input.filters?.preferredMemberTags),
  };
}

function parseStoredFilterSnapshot(value: unknown): RandomPickFilterSnapshotDto {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    weekStartDate: typeof record.weekStartDate === "string" ? record.weekStartDate : null,
    categoryIds: Array.isArray(record.categoryIds)
      ? record.categoryIds.filter((item): item is string => typeof item === "string")
      : [],
    tagIds: Array.isArray(record.tagIds)
      ? record.tagIds.filter((item): item is string => typeof item === "string")
      : [],
    maxDifficulty:
      typeof record.maxDifficulty === "number" ? record.maxDifficulty : null,
    excludeRecentDays:
      typeof record.excludeRecentDays === "number" ? record.excludeRecentDays : null,
    excludeCurrentWeekPlanned: Boolean(record.excludeCurrentWeekPlanned),
    preferredMemberTags: Array.isArray(record.preferredMemberTags)
      ? record.preferredMemberTags.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  };
}

function isCandidateRecord(
  record: randomRepository.RandomCandidateRecipeRecord,
): record is CandidateRecord {
  return record.currentVersion !== null;
}

function inferDifficultyRating(
  recipeVersion: {
    steps: Array<{ id: string }>;
    tagLinks: Array<{ tag: { name: string } }>;
    category: { name: string } | null;
  },
) {
  const tagNames = recipeVersion.tagLinks.map((tagLink) => tagLink.tag.name.toLowerCase());
  const categoryName = recipeVersion.category?.name.toLowerCase() ?? "";
  const stepCount = recipeVersion.steps.length;

  if (tagNames.some((name) => /easy|简单|快手|低难/.test(name))) {
    return 2;
  }

  if (tagNames.some((name) => /hard|复杂|挑战/.test(name))) {
    return 4;
  }

  if (/soup|汤/.test(categoryName) && stepCount <= 3) {
    return 2;
  }

  if (stepCount <= 3) {
    return 2;
  }

  if (stepCount >= 6) {
    return 4;
  }

  return 3;
}

function classifyCandidate(candidate: CandidateRecord) {
  const categoryName = candidate.currentVersion.category?.name.toLowerCase() ?? "";
  const tagNames = candidate.currentVersion.tagLinks.map((tagLink) =>
    tagLink.tag.name.toLowerCase(),
  );
  const combined = `${candidate.name.toLowerCase()} ${categoryName} ${tagNames.join(" ")}`;

  if (/汤|soup|羹|煲/.test(combined)) {
    return "soup" as const;
  }

  if (/素|vegetable|veggie|蔬|青菜|西兰花|生菜|白菜|豆腐/.test(combined)) {
    return "vegetable" as const;
  }

  return "other" as const;
}

function calculateWeight(input: {
  candidate: CandidateRecord;
  difficultyRating: number;
  filterSnapshot: RandomPickFilterSnapshotDto;
  categoryMatch: boolean;
  tagMatch: boolean;
  preferredTagMatches: string[];
}) {
  let weight = 1;

  if (input.categoryMatch) {
    weight += 3;
  }

  if (input.tagMatch) {
    weight += 2;
  }

  if (input.preferredTagMatches.length > 0) {
    weight += 2;
  }

  if (input.filterSnapshot.maxDifficulty !== null) {
    weight += Math.max(0, input.filterSnapshot.maxDifficulty - input.difficultyRating + 1);
  }

  if (!input.candidate.latestCookedAt) {
    weight += 1;
  }

  if (
    input.candidate.currentVersion.tagLinks.some((tagLink) =>
      /quick|easy|快手|简单/i.test(tagLink.tag.name),
    )
  ) {
    weight += 1;
  }

  return Math.max(weight, 1);
}

function pickByWeight<T extends { weight: number }>(items: T[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = Math.random() * total;

  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) {
      return item;
    }
  }

  return items[items.length - 1] ?? null;
}

function buildReasonMeta(input: {
  candidate: ScoredCandidate;
  tier: BuiltResult["usedTier"];
  weekStartDate: string | null;
  pickedForDate: Date | null;
}) {
  return {
    strategy: input.tier,
    inferredDifficulty: input.candidate.difficultyRating,
    categoryMatch: input.candidate.categoryMatch,
    tagMatch: input.candidate.tagMatch,
    preferredMemberTagsMatched: input.candidate.preferredTagMatches,
    classification: input.candidate.classification,
    weekStartDate: input.weekStartDate,
    pickedForDate: input.pickedForDate ? formatDateOnly(input.pickedForDate) : null,
  };
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

async function getRandomPickSessionOrThrow(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
  },
) {
  const session = await randomRepository.findRandomPickSessionById(db, input);

  if (!session) {
    throw new AppError("随机点菜 session 不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return session;
}

async function getRandomPickResultOrThrow(
  db: DbClient,
  input: {
    householdId: string;
    sessionId: string;
    resultId: string;
  },
) {
  const result = await randomRepository.findRandomPickResultById(db, input);

  if (!result) {
    throw new AppError("随机点菜结果不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return result;
}

async function buildScoredCandidates(
  db: DbClient,
  input: {
    householdId: string;
    filterSnapshot: RandomPickFilterSnapshotDto;
    skippedRecipeIds?: string[];
    excludeRecipeIds?: string[];
  },
) {
  const [recipes, currentWeekPlannedRecipeIds] = await Promise.all([
    randomRepository.listRandomCandidateRecipes(db, {
      householdId: input.householdId,
    }),
    input.filterSnapshot.excludeCurrentWeekPlanned
      ? randomRepository.listCurrentWeekPlannedRecipeIds(db, {
          householdId: input.householdId,
          weekStartDate: parseDateOnly(
            input.filterSnapshot.weekStartDate ?? formatDateOnly(getWeekStartDateForToday()),
            "weekStartDate",
          ),
        })
      : Promise.resolve([]),
  ]);

  const excludeRecipeIds = new Set([
    ...currentWeekPlannedRecipeIds,
    ...(input.skippedRecipeIds ?? []),
    ...(input.excludeRecipeIds ?? []),
  ]);
  const recentThreshold =
    input.filterSnapshot.excludeRecentDays !== null
      ? (() => {
          const date = new Date();
          date.setUTCDate(date.getUTCDate() - input.filterSnapshot.excludeRecentDays);
          return formatDateOnly(
            new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
          );
        })()
      : null;

  const preferredMemberTagsLower = input.filterSnapshot.preferredMemberTags.map((tag) =>
    tag.toLowerCase(),
  );

  return recipes
    .filter(isCandidateRecord)
    .filter((recipe) => !excludeRecipeIds.has(recipe.id))
    .filter((recipe) => {
      if (!recentThreshold || !recipe.latestCookedAt) {
        return true;
      }

      return formatDateOnly(recipe.latestCookedAt) < recentThreshold;
    })
    .map<ScoredCandidate>((recipe) => {
      const difficultyRating = inferDifficultyRating(recipe.currentVersion);
      const categoryId = recipe.currentVersion.categoryId;
      const tagIds = recipe.currentVersion.tagLinks.map((tagLink) => tagLink.tag.id);
      const tagNames = recipe.currentVersion.tagLinks.map((tagLink) => tagLink.tag.name);
      const categoryMatch =
        input.filterSnapshot.categoryIds.length === 0 ||
        (categoryId !== null && input.filterSnapshot.categoryIds.includes(categoryId));
      const tagMatch =
        input.filterSnapshot.tagIds.length === 0 ||
        tagIds.some((tagId) => input.filterSnapshot.tagIds.includes(tagId));
      const difficultyMatch =
        input.filterSnapshot.maxDifficulty === null ||
        difficultyRating <= input.filterSnapshot.maxDifficulty;
      const preferredTagMatches = tagNames.filter((tagName) =>
        preferredMemberTagsLower.includes(tagName.toLowerCase()),
      );
      const similarEligible =
        difficultyMatch &&
        !(
          categoryMatch &&
          tagMatch &&
          difficultyMatch
        ) &&
        (
          (input.filterSnapshot.categoryIds.length > 0 && categoryMatch) ||
          (input.filterSnapshot.tagIds.length > 0 && tagMatch) ||
          preferredTagMatches.length > 0
        );

      return {
        recipe,
        difficultyRating,
        categoryName: recipe.currentVersion.category?.name ?? null,
        tagNames,
        preferredTagMatches,
        categoryMatch,
        tagMatch,
        strictEligible: difficultyMatch && categoryMatch && tagMatch,
        similarEligible,
        generalEligible: difficultyMatch,
        classification: classifyCandidate(recipe),
        weight: calculateWeight({
          candidate: recipe,
          difficultyRating,
          filterSnapshot: input.filterSnapshot,
          categoryMatch,
          tagMatch,
          preferredTagMatches,
        }),
      };
    });
}

function selectSingleResult(input: {
  candidates: ScoredCandidate[];
  filterSnapshot: RandomPickFilterSnapshotDto;
}): BuiltResult | null {
  const strict = input.candidates.filter((candidate) => candidate.strictEligible);
  if (strict.length > 0) {
    const selected = pickByWeight(strict);
    if (!selected) {
      return null;
    }

    return {
      recipe: selected.recipe,
      difficultyRating: selected.difficultyRating,
      pickedForDate: null,
      usedTier: "strict",
      reasonMeta: buildReasonMeta({
        candidate: selected,
        tier: "strict",
        weekStartDate: input.filterSnapshot.weekStartDate,
        pickedForDate: null,
      }),
    };
  }

  const similar = input.candidates.filter((candidate) => candidate.similarEligible);
  if (similar.length > 0) {
    const selected = pickByWeight(similar);
    if (!selected) {
      return null;
    }

    return {
      recipe: selected.recipe,
      difficultyRating: selected.difficultyRating,
      pickedForDate: null,
      usedTier: "similar",
      reasonMeta: buildReasonMeta({
        candidate: selected,
        tier: "similar",
        weekStartDate: input.filterSnapshot.weekStartDate,
        pickedForDate: null,
      }),
    };
  }

  const general = input.candidates.filter((candidate) => candidate.generalEligible);
  if (
    input.filterSnapshot.categoryIds.length === 0 &&
    input.filterSnapshot.tagIds.length === 0 &&
    general.length > 0
  ) {
    const selected = pickByWeight(general);
    if (!selected) {
      return null;
    }

    return {
      recipe: selected.recipe,
      difficultyRating: selected.difficultyRating,
      pickedForDate: null,
      usedTier: "general",
      reasonMeta: buildReasonMeta({
        candidate: selected,
        tier: "general",
        weekStartDate: input.filterSnapshot.weekStartDate,
        pickedForDate: null,
      }),
    };
  }

  return null;
}

function pickWeekCandidate(
  remaining: ScoredCandidate[],
  input: {
    tier: BuiltResult["usedTier"];
    date: Date;
    weekStartDate: string | null;
    previousCategoryName: string | null;
    predicate?: (candidate: ScoredCandidate) => boolean;
  },
) {
  const filtered = remaining.filter((candidate) => {
    if (input.predicate && !input.predicate(candidate)) {
      return false;
    }

    if (
      input.previousCategoryName &&
      candidate.categoryName &&
      candidate.categoryName === input.previousCategoryName
    ) {
      return false;
    }

    return true;
  });
  const source = filtered.length > 0 ? filtered : remaining.filter((candidate) =>
    input.predicate ? input.predicate(candidate) : true,
  );
  const selected = pickByWeight(source);

  if (!selected) {
    return null;
  }

  return {
    recipe: selected.recipe,
    difficultyRating: selected.difficultyRating,
    pickedForDate: input.date,
    usedTier: input.tier,
    reasonMeta: buildReasonMeta({
      candidate: selected,
      tier: input.tier,
      weekStartDate: input.weekStartDate,
      pickedForDate: input.date,
    }),
  } satisfies BuiltResult;
}

function buildWeekResults(input: {
  candidates: ScoredCandidate[];
  filterSnapshot: RandomPickFilterSnapshotDto;
}) {
  const weekStartDate = parseDateOnly(
    input.filterSnapshot.weekStartDate ?? formatDateOnly(getWeekStartDateForToday()),
    "weekStartDate",
  );
  const strict = input.candidates.filter((candidate) => candidate.strictEligible);
  const similar = input.candidates.filter((candidate) => candidate.similarEligible);
  const general = input.candidates.filter((candidate) => candidate.generalEligible);
  const totalAvailableRecipeIds = new Set(general.map((candidate) => candidate.recipe.id));

  if (totalAvailableRecipeIds.size < 7) {
    throw new AppError("候选菜谱不足以完成连抽，请放宽条件后再试", {
      code: errorCodes.BUSINESS_RULE_VIOLATION,
      statusCode: 422,
    });
  }

  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStartDate);
    date.setUTCDate(weekStartDate.getUTCDate() + index);
    return date;
  });

  const selected: BuiltResult[] = [];
  const usedRecipeIds = new Set<string>();

  const takeFromPool = (
    pool: ScoredCandidate[],
    options: {
      date: Date;
      predicate?: (candidate: ScoredCandidate) => boolean;
    },
  ) => {
    const remaining = pool.filter((candidate) => !usedRecipeIds.has(candidate.recipe.id));
    if (remaining.length === 0) {
      return null;
    }

    const built = pickWeekCandidate(remaining, {
      tier:
        pool === strict ? "strict" : pool === similar ? "similar" : "general",
      date: options.date,
      weekStartDate: input.filterSnapshot.weekStartDate,
      previousCategoryName: selected[selected.length - 1]?.recipe.currentVersion.category?.name ?? null,
      predicate: options.predicate,
    });

    if (built) {
      usedRecipeIds.add(built.recipe.id);
      selected.push(built);
    }

    return built;
  };

  const tryTakeForDate = (
    date: Date,
    predicate?: (candidate: ScoredCandidate) => boolean,
  ) =>
    takeFromPool(strict, { date, predicate }) ??
    takeFromPool(similar, { date, predicate }) ??
    takeFromPool(general, { date, predicate });

  tryTakeForDate(dates[0], (candidate) => candidate.classification === "soup");

  if (selected.length < 2) {
    tryTakeForDate(dates[selected.length], (candidate) => candidate.classification === "vegetable");
  }

  while (selected.length < 7) {
    const date = dates[selected.length];
    tryTakeForDate(date);
  }

  return selected
    .slice(0, 7)
    .map((item, index) => ({
      ...item,
      pickedForDate: dates[index],
      reasonMeta: {
        ...item.reasonMeta,
        pickedForDate: formatDateOnly(dates[index]),
      },
    }));
}

function buildDifficultyByResultIdMap(
  results: Array<{
    id: string;
    recipeVersion: {
      steps: Array<{ id: string }>;
      tagLinks: Array<{ tag: { name: string } }>;
      category: { name: string } | null;
    };
  }>,
) {
  return new Map(
    results.map((result: { id: string; recipeVersion: { steps: Array<{ id: string }>; tagLinks: Array<{ tag: { name: string } }>; category: { name: string } | null } }) => [
      result.id,
      inferDifficultyRating(result.recipeVersion),
    ]),
  );
}

function resolveSessionStatus(input: {
  mode: RandomPickMode;
  hasAcceptedResult: boolean;
  pendingCount: number;
}) {
  if (input.mode === "single") {
    return input.hasAcceptedResult ? "completed" : "running";
  }

  if (input.pendingCount === 0) {
    return "completed";
  }

  return "running";
}

function createNoCandidateError() {
  return new AppError("当前条件下没有可用候选菜谱，请放宽条件后重试", {
    code: errorCodes.BUSINESS_RULE_VIOLATION,
    statusCode: 422,
  });
}

export async function createRandomPickSession(
  input: CreateRandomPickSessionServiceInput,
): Promise<RandomPickSessionCreateResultDto> {
  const householdId = resolveRandomHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);
  const filterSnapshot = normalizeFilterSnapshot(input.data);

  const record = await withTransaction(async (tx) => {
    const session = await randomRepository.createRandomPickSession(tx, {
      householdId,
      mode: input.data.mode,
      filterSnapshot: filterSnapshot as Prisma.InputJsonValue,
      createdById,
    });

    const candidates = await buildScoredCandidates(tx, {
      householdId,
      filterSnapshot,
    });

    const builtResults =
      input.data.mode === "single"
        ? (() => {
            const single = selectSingleResult({
              candidates,
              filterSnapshot,
            });

            if (!single) {
              throw createNoCandidateError();
            }

            return [single];
          })()
        : buildWeekResults({
            candidates,
            filterSnapshot,
          });

    await randomRepository.createRandomPickResults(tx, {
      sessionId: session.id,
      results: builtResults.map((result, index) => ({
        recipeId: result.recipe.id,
        recipeVersionId: result.recipe.currentVersion.id,
        pickedForDate: result.pickedForDate,
        sequenceNo: index + 1,
        reasonMeta: result.reasonMeta as Prisma.InputJsonValue,
      })),
    });

    await randomRepository.updateRandomPickSessionById(tx, {
      householdId,
      id: session.id,
      resultCount: builtResults.length,
      status: "running",
    });

    const created = await getRandomPickSessionOrThrow(tx, {
      householdId,
      id: session.id,
    });

    logger.info(
      {
        householdId,
        sessionId: created.id,
        mode: created.mode,
        resultCount: created.resultCount,
      },
      "random pick session created",
    );

    return created;
  });

  return mapRandomPickSessionCreateResultDto({
    record,
    filterSnapshot,
    weekStartDate: filterSnapshot.weekStartDate,
    difficultyByResultId: buildDifficultyByResultIdMap(record.results),
  });
}

export async function redrawRandomPickSession(
  input: RandomPickSessionIdServiceInput,
): Promise<RandomPickRedrawResultDto> {
  const householdId = resolveRandomHouseholdId(input.session);

  const result = await withTransaction(async (tx) => {
    const session = await getRandomPickSessionOrThrow(tx, {
      householdId,
      id: input.id,
    });

    if (session.mode !== "single") {
      throw new AppError("仅单抽模式支持再来一次", {
        code: errorCodes.BUSINESS_RULE_VIOLATION,
        statusCode: 422,
      });
    }

    if (session.status === "completed") {
      throw new AppError("当前 session 已结束，不能再抽", {
        code: errorCodes.CONFLICT,
        statusCode: 409,
      });
    }

    await randomRepository.markPendingResultsSkipped(tx, {
      householdId,
      sessionId: session.id,
    });

    const reloadedSession = await getRandomPickSessionOrThrow(tx, {
      householdId,
      id: session.id,
    });
    const filterSnapshot = parseStoredFilterSnapshot(reloadedSession.filterSnapshot);
    const skippedRecipeIds = reloadedSession.results
      .filter((item) => item.decision === "skipped")
      .map((item) => item.recipeId);
    const candidates = await buildScoredCandidates(tx, {
      householdId,
      filterSnapshot,
      skippedRecipeIds,
    });
    const builtResult = selectSingleResult({
      candidates,
      filterSnapshot,
    });

    if (!builtResult) {
      throw createNoCandidateError();
    }

    const sequenceNo = await randomRepository.getNextRandomPickSequenceNo(tx, {
      sessionId: session.id,
    });
    await randomRepository.createRandomPickResults(tx, {
      sessionId: session.id,
      results: [
        {
          recipeId: builtResult.recipe.id,
          recipeVersionId: builtResult.recipe.currentVersion.id,
          pickedForDate: null,
          sequenceNo,
          reasonMeta: builtResult.reasonMeta as Prisma.InputJsonValue,
        },
      ],
    });

    await randomRepository.updateRandomPickSessionById(tx, {
      householdId,
      id: session.id,
      resultCount: sequenceNo,
      status: "running",
    });

    const updatedSession = await getRandomPickSessionOrThrow(tx, {
      householdId,
      id: session.id,
    });
    const latest = updatedSession.results[updatedSession.results.length - 1];

    if (!latest) {
      throw new AppError("重抽结果生成失败", {
        code: errorCodes.INTERNAL_ERROR,
        statusCode: 500,
      });
    }

    return {
      session: updatedSession,
      filterSnapshot,
      result: latest,
    };
  });

  return {
    sessionId: result.session.id,
    result: mapRandomPickResultDto({
      record: result.result,
      difficultyRating: inferDifficultyRating(result.result.recipeVersion),
    }),
  };
}

export async function acceptRandomPickResult(
  input: AcceptRandomPickResultServiceInput,
): Promise<RandomPickResultAcceptResultDto> {
  const householdId = resolveRandomHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);

  const mealPlanItemId = await withTransaction(async (tx) => {
    const result = await getRandomPickResultOrThrow(tx, {
      householdId,
      sessionId: input.id,
      resultId: input.resultId,
    });

    if (result.decision === "accepted") {
      throw new AppError("该随机结果已接受", {
        code: errorCodes.CONFLICT,
        statusCode: 409,
      });
    }

    const selectedRecipeVersionId = input.data.recipeVersionId ?? result.recipeVersionId;
    const recipeVersion = await randomRepository.findRecipeVersionForRandomAccept(tx, {
      householdId,
      recipeId: result.recipeId,
      recipeVersionId: selectedRecipeVersionId,
    });

    if (!recipeVersion) {
      throw new AppError("recipeVersionId 必须属于命中 recipeId", {
        code: errorCodes.BUSINESS_RULE_VIOLATION,
        statusCode: 422,
      });
    }

    const plannedDate = input.data.plannedDate
      ? parseDateOnly(input.data.plannedDate, "plannedDate")
      : result.pickedForDate;

    if (!plannedDate) {
      throw new AppError("plannedDate 不能为空", {
        code: errorCodes.VALIDATION_ERROR,
        statusCode: 400,
      });
    }

    const weekStartDate = getWeekStartDateForDate(plannedDate);
    assertDateInWeek(plannedDate, weekStartDate);

    const mealPlanWeek = await ensureMealPlanWeek(tx, {
      householdId,
      weekStartDate,
      createdById,
    });
    const mealSlot = input.data.mealSlot ?? "dinner";
    const sortOrder = await plansRepository.getNextSortOrder(tx, {
      mealPlanWeekId: mealPlanWeek.id,
      plannedDate,
      mealSlot,
    });
    const mealPlanItem = await plansRepository.createMealPlanItem(tx, {
      mealPlanWeekId: mealPlanWeek.id,
      recipeId: result.recipeId,
      recipeVersionId: selectedRecipeVersionId,
      plannedDate,
      mealSlot,
      sortOrder,
      note: normalizeText(input.data.note),
      sourceType: "random",
      randomSessionId: result.sessionId,
    });

    await randomRepository.updateRandomPickResultDecision(tx, {
      householdId,
      sessionId: result.sessionId,
      resultId: result.id,
      decision: "accepted",
      recipeVersionId:
        selectedRecipeVersionId !== result.recipeVersionId
          ? selectedRecipeVersionId
          : undefined,
    });

    const pendingCount = await randomRepository.countPendingRandomPickResults(tx, {
      sessionId: result.sessionId,
    });

    await randomRepository.updateRandomPickSessionById(tx, {
      householdId,
      id: result.sessionId,
      status: resolveSessionStatus({
        mode: result.session.mode as RandomPickMode,
        hasAcceptedResult: true,
        pendingCount,
      }),
    });

    return mealPlanItem.id;
  });

  return {
    accepted: true,
    mealPlanItemId,
  };
}

export async function skipRandomPickResult(
  input: RandomPickResultIdServiceInput,
): Promise<RandomPickResultSkipResultDto> {
  const householdId = resolveRandomHouseholdId(input.session);

  await withTransaction(async (tx) => {
    const result = await getRandomPickResultOrThrow(tx, {
      householdId,
      sessionId: input.id,
      resultId: input.resultId,
    });

    if (result.decision === "accepted") {
      throw new AppError("已接受的结果不能跳过", {
        code: errorCodes.CONFLICT,
        statusCode: 409,
      });
    }

    if (result.decision !== "skipped") {
      await randomRepository.updateRandomPickResultDecision(tx, {
        householdId,
        sessionId: result.sessionId,
        resultId: result.id,
        decision: "skipped",
      });
    }

    const pendingCount = await randomRepository.countPendingRandomPickResults(tx, {
      sessionId: result.sessionId,
    });

    await randomRepository.updateRandomPickSessionById(tx, {
      householdId,
      id: result.sessionId,
      status: resolveSessionStatus({
        mode: result.session.mode as RandomPickMode,
        hasAcceptedResult: result.session.mode === "single" ? false : false,
        pendingCount,
      }),
    });
  });

  return {
    skipped: true,
  };
}

export async function getRandomPickSessionDetail(
  input: RandomPickSessionIdServiceInput,
): Promise<RandomPickSessionDetailDto> {
  const householdId = resolveRandomHouseholdId(input.session);
  const session = await getRandomPickSessionOrThrow(prisma, {
    householdId,
    id: input.id,
  });
  const filterSnapshot = parseStoredFilterSnapshot(session.filterSnapshot);

  return mapRandomPickSessionDetailDto({
    record: session,
    filterSnapshot,
    weekStartDate: filterSnapshot.weekStartDate,
    difficultyByResultId: buildDifficultyByResultIdMap(session.results),
  });
}
