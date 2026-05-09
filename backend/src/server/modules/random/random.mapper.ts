import type { Category, Tag } from "@prisma/client";

import type { RandomSessionDetailRecord } from "@/server/modules/random/random.repository";
import type {
  RandomPickCategoryDto,
  RandomPickFilterSnapshotDto,
  RandomPickRecipeVersionDto,
  RandomPickResultDto,
  RandomPickSessionCreateResultDto,
  RandomPickSessionDetailDto,
  RandomPickSessionSummaryDto,
  RandomPickTagDto,
} from "@/server/modules/random/random.types";

type CategoryRecord = Pick<Category, "id" | "name" | "color">;
type TagRecord = Pick<Tag, "id" | "name" | "sortOrder">;

function toDateString(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function toObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function mapCategoryDto(record: CategoryRecord | null | undefined): RandomPickCategoryDto | null {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    color: record.color,
  };
}

function mapTagDto(record: TagRecord): RandomPickTagDto {
  return {
    id: record.id,
    name: record.name,
    sortOrder: record.sortOrder,
  };
}

function mapTagList(records: TagRecord[]) {
  return [...records]
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "zh-CN"),
    )
    .map(mapTagDto);
}

function mapAvailableVersions(
  versions: Array<{
    id: string;
    versionNumber: number;
    versionName: string | null;
  }>,
) {
  return versions.map((version) => ({
    id: version.id,
    versionNumber: version.versionNumber,
    versionName: version.versionName,
  }));
}

type ResultRecipeVersionLike = {
  id: string;
  versionNumber: number;
  versionName: string | null;
  category: CategoryRecord | null;
  tagLinks: Array<{
    tag: TagRecord;
  }>;
};

export function mapRandomPickRecipeVersionDto(
  record: ResultRecipeVersionLike,
  difficultyRating: number,
): RandomPickRecipeVersionDto {
  return {
    id: record.id,
    versionNumber: record.versionNumber,
    versionName: record.versionName,
    category: mapCategoryDto(record.category),
    tags: mapTagList(record.tagLinks.map((tagLink) => tagLink.tag)),
    difficultyRating,
  };
}

type ResultLike = {
  id: string;
  sequenceNo: number;
  pickedForDate: Date | null;
  decision: string;
  reasonMeta: unknown;
  createdAt: Date;
  recipe: {
    id: string;
    name: string;
    coverImage: {
      assetUrl: string;
    } | null;
  };
  recipeVersion: ResultRecipeVersionLike & {
    recipe: {
      versions: Array<{
        id: string;
        versionNumber: number;
        versionName: string | null;
      }>;
    };
  };
};

export function mapRandomPickResultDto(input: {
  record: ResultLike;
  difficultyRating: number;
}): RandomPickResultDto {
  return {
    id: input.record.id,
    sequenceNo: input.record.sequenceNo,
    pickedForDate: toDateString(input.record.pickedForDate),
    decision: input.record.decision as RandomPickResultDto["decision"],
    reasonMeta: toObjectRecord(input.record.reasonMeta),
    recipe: {
      id: input.record.recipe.id,
      name: input.record.recipe.name,
      coverImageUrl: input.record.recipe.coverImage?.assetUrl ?? null,
    },
    recipeVersion: mapRandomPickRecipeVersionDto(
      input.record.recipeVersion,
      input.difficultyRating,
    ),
    availableVersions: mapAvailableVersions(input.record.recipeVersion.recipe.versions),
    createdAt: input.record.createdAt.toISOString(),
  };
}

export function mapRandomPickSessionSummaryDto(input: {
  record: Pick<
    RandomSessionDetailRecord,
    "id" | "mode" | "status" | "filterSnapshot" | "resultCount" | "createdAt"
  >;
  weekStartDate: string | null;
  filterSnapshot: RandomPickFilterSnapshotDto;
}): RandomPickSessionSummaryDto {
  return {
    id: input.record.id,
    mode: input.record.mode as RandomPickSessionSummaryDto["mode"],
    status: input.record.status as RandomPickSessionSummaryDto["status"],
    weekStartDate: input.weekStartDate,
    filterSnapshot: input.filterSnapshot,
    resultCount: input.record.resultCount,
    createdAt: input.record.createdAt.toISOString(),
  };
}

export function mapRandomPickSessionDetailDto(input: {
  record: RandomSessionDetailRecord;
  filterSnapshot: RandomPickFilterSnapshotDto;
  weekStartDate: string | null;
  difficultyByResultId: Map<string, number>;
}): RandomPickSessionDetailDto {
  return {
    session: mapRandomPickSessionSummaryDto({
      record: input.record,
      filterSnapshot: input.filterSnapshot,
      weekStartDate: input.weekStartDate,
    }),
    results: input.record.results.map((result: RandomSessionDetailRecord["results"][number]) =>
      mapRandomPickResultDto({
        record: result,
        difficultyRating: input.difficultyByResultId.get(result.id) ?? 3,
      }),
    ),
  };
}

export function mapRandomPickSessionCreateResultDto(input: {
  record: RandomSessionDetailRecord;
  filterSnapshot: RandomPickFilterSnapshotDto;
  weekStartDate: string | null;
  difficultyByResultId: Map<string, number>;
}): RandomPickSessionCreateResultDto {
  return {
    sessionId: input.record.id,
    mode: input.record.mode as RandomPickSessionCreateResultDto["mode"],
    status: input.record.status as RandomPickSessionCreateResultDto["status"],
    weekStartDate: input.weekStartDate,
    filterSnapshot: input.filterSnapshot,
    results: input.record.results.map((result: RandomSessionDetailRecord["results"][number]) =>
      mapRandomPickResultDto({
        record: result,
        difficultyRating: input.difficultyByResultId.get(result.id) ?? 3,
      }),
    ),
  };
}
