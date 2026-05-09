import type { MealSlot } from "@/server/modules/plans/plans.types";

export type RandomPickMode = "single" | "week";
export type RandomPickStatus = "running" | "completed" | "abandoned";
export type RandomPickDecision = "accepted" | "skipped" | "pending";

export type RandomPickFiltersPayload = {
  categoryIds?: string[];
  tagIds?: string[];
  maxDifficulty?: number;
  excludeRecentDays?: number;
  excludeCurrentWeekPlanned?: boolean;
  preferredMemberTags?: string[];
};

export type RandomPickSessionCreatePayload = {
  mode: RandomPickMode;
  weekStartDate?: string;
  filters?: RandomPickFiltersPayload;
};

export type RandomPickResultAcceptPayload = {
  plannedDate?: string;
  mealSlot?: MealSlot;
  recipeVersionId?: string;
  note?: string | null;
};

export type RandomPickFilterSnapshotDto = {
  weekStartDate: string | null;
  categoryIds: string[];
  tagIds: string[];
  maxDifficulty: number | null;
  excludeRecentDays: number | null;
  excludeCurrentWeekPlanned: boolean;
  preferredMemberTags: string[];
};

export type RandomPickRecipeVersionOptionDto = {
  id: string;
  versionNumber: number;
  versionName: string | null;
};

export type RandomPickCategoryDto = {
  id: string;
  name: string;
  color: string | null;
};

export type RandomPickTagDto = {
  id: string;
  name: string;
  sortOrder: number;
};

export type RandomPickRecipeDto = {
  id: string;
  name: string;
  coverImageUrl: string | null;
};

export type RandomPickRecipeVersionDto = {
  id: string;
  versionNumber: number;
  versionName: string | null;
  category: RandomPickCategoryDto | null;
  tags: RandomPickTagDto[];
  difficultyRating: number;
};

export type RandomPickResultDto = {
  id: string;
  sequenceNo: number;
  pickedForDate: string | null;
  decision: RandomPickDecision;
  reasonMeta: Record<string, unknown> | null;
  recipe: RandomPickRecipeDto;
  recipeVersion: RandomPickRecipeVersionDto;
  availableVersions: RandomPickRecipeVersionOptionDto[];
  createdAt: string;
};

export type RandomPickSessionSummaryDto = {
  id: string;
  mode: RandomPickMode;
  status: RandomPickStatus;
  weekStartDate: string | null;
  filterSnapshot: RandomPickFilterSnapshotDto;
  resultCount: number;
  createdAt: string;
};

export type RandomPickSessionDetailDto = {
  session: RandomPickSessionSummaryDto;
  results: RandomPickResultDto[];
};

export type RandomPickSessionCreateResultDto = {
  sessionId: string;
  mode: RandomPickMode;
  status: RandomPickStatus;
  weekStartDate: string | null;
  filterSnapshot: RandomPickFilterSnapshotDto;
  results: RandomPickResultDto[];
};

export type RandomPickRedrawResultDto = {
  sessionId: string;
  result: RandomPickResultDto;
};

export type RandomPickResultAcceptResultDto = {
  accepted: true;
  mealPlanItemId: string;
};

export type RandomPickResultSkipResultDto = {
  skipped: true;
};
