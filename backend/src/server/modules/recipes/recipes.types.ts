import type { Prisma } from "@prisma/client";

import type { PageResult } from "@/server/lib/api/response";
import type {
  RecipeVersionComparableSnapshot,
  RecipeVersionDiffSummaryJson,
} from "@/server/lib/diff";

export type HouseholdScopedInput = {
  householdId: string;
};

export type IncludeArchivedInput = {
  includeArchived?: boolean;
};

export type RecipeIdInput = HouseholdScopedInput &
  IncludeArchivedInput & {
    id: string;
  };

export type RecipeVersionIdInput = HouseholdScopedInput & {
  recipeId: string;
  versionId: string;
};

export type RecipeListSortBy = "updatedAt" | "latestMomentAt" | "name";

export type RecipeListInput = HouseholdScopedInput & {
  page: number;
  pageSize: number;
  keyword?: string;
  categoryId?: string;
  tagIds?: string[];
  sortBy?: RecipeListSortBy;
};

export type RecipeVersionsListInput = HouseholdScopedInput & {
  recipeId: string;
  page: number;
  pageSize: number;
};

export type RecipeTaxonomyPayload = {
  categoryId?: string;
  newCategoryName?: string;
  tagIds?: string[];
  newTagNames?: string[];
};

export type RecipeStepPayload = {
  sortOrder?: number;
  content: string;
};

export type RecipeIngredientPayload = {
  sortOrder?: number;
  rawText: string;
  normalizedName?: string | null;
  amountText?: string | null;
  unit?: string | null;
  isSeasoning?: boolean;
  parseSource?: "manual" | "rule";
};

export type RecipeCreatePayload = RecipeTaxonomyPayload & {
  name: string;
  slug?: string | null;
  versionName?: string | null;
  ingredientsText?: string | null;
  ingredients?: RecipeIngredientPayload[];
  steps?: RecipeStepPayload[];
  tips?: string | null;
  isMajor?: boolean;
};

export type RecipeUpdatePayload = {
  name?: string;
  slug?: string | null;
  coverImageId?: string | null;
  coverSource?: "custom" | "moment_latest" | "none";
  status?: "active" | "archived";
};

export type RecipeVersionCreatePayload = RecipeTaxonomyPayload & {
  sourceVersionId?: string;
  versionName?: string | null;
  ingredientsText?: string | null;
  ingredients?: RecipeIngredientPayload[];
  steps?: RecipeStepPayload[];
  tips?: string | null;
  isMajor?: boolean;
};

export type RecipeCategoryDto = {
  id: string;
  name: string;
  color: string | null;
};

export type RecipeTagDto = {
  id: string;
  name: string;
  sortOrder: number;
};

export type RecipeStepDto = {
  sortOrder: number;
  content: string;
};

export type RecipeIngredientDto = {
  sortOrder: number;
  rawText: string;
  normalizedName: string | null;
  amountText: string | null;
  unit: string | null;
  isSeasoning: boolean;
  parseSource: string;
};

export type RecipeVersionListItemDto = {
  id: string;
  versionNumber: number;
  versionName: string | null;
  isCurrent: boolean;
  diffSummaryText: string | null;
  createdAt: string;
};

export type RecipeVersionDetailDto = {
  id: string;
  versionNumber: number;
  versionName: string | null;
  sourceVersionId: string | null;
  isCurrent: boolean;
  diffSummaryText: string | null;
  diffSummaryJson: RecipeVersionDiffSummaryJson | null;
  category: RecipeCategoryDto | null;
  tags: RecipeTagDto[];
  ingredientsText: string | null;
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  tips: string | null;
  createdAt: string;
};

export type RecipeCurrentVersionDto = {
  id: string;
  versionNumber: number;
  versionName: string | null;
  category: RecipeCategoryDto | null;
  tags: RecipeTagDto[];
};

export type RecipeListItemDto = {
  id: string;
  name: string;
  coverImageUrl: string | null;
  currentVersion: RecipeCurrentVersionDto | null;
  versionCount: number;
  momentCount: number;
  latestMomentAt: string | null;
  latestCookedAt: string | null;
};

export type RecipeDetailDto = {
  id: string;
  name: string;
  slug: string | null;
  coverImageUrl: string | null;
  coverSource: string;
  versionCount: number;
  momentCount: number;
  latestMomentAt: string | null;
  latestCookedAt: string | null;
  status: string;
  currentVersion: RecipeVersionDetailDto | null;
};

export type CreateRecipeResultDto = {
  recipeId: string;
  currentVersionId: string;
  versionNumber: number;
};

export type CreateRecipeVersionResultDto = {
  versionId: string;
  versionNumber: number;
  diffSummaryText: string | null;
};

export type DeleteRecipeResultDto = {
  deleted: true;
};

export type SetCurrentRecipeVersionResultDto = {
  recipeId: string;
  currentVersionId: string;
};

export type RecipeVersionCompareDto = {
  baseVersion: {
    id: string;
    versionNumber: number;
    versionName: string | null;
  };
  targetVersion: {
    id: string;
    versionNumber: number;
    versionName: string | null;
  };
  summaryText: string;
  summaryJson: RecipeVersionDiffSummaryJson;
};

export type RecipeListResultDto = PageResult<RecipeListItemDto>;
export type RecipeVersionListResultDto = PageResult<RecipeVersionListItemDto>;

export type RecipeTaxonomyResolutionResult = {
  category: RecipeCategoryDto | null;
  tagIds: string[];
  tagDtos: RecipeTagDto[];
};

export type RecipeStepWriteInput = {
  sortOrder: number;
  content: string;
};

export type RecipeIngredientWriteInput = {
  sortOrder: number;
  rawText: string;
  normalizedName: string | null;
  amountText: string | null;
  unit: string | null;
  isSeasoning: boolean;
  parseSource: "manual" | "rule";
};

export type RecipeVersionWriteInput = HouseholdScopedInput & {
  recipeId: string;
  versionNumber: number;
  versionName: string | null;
  categoryId: string | null;
  ingredientsText: string | null;
  tips: string | null;
  diffSummaryText: string | null;
  diffSummaryJson: Prisma.InputJsonValue | null;
  sourceVersionId: string | null;
  isMajor: boolean;
  createdById: string;
  steps: RecipeStepWriteInput[];
  ingredients: RecipeIngredientWriteInput[];
  tagIds: string[];
};

export type RecipeVersionWriteBuildResult = {
  versionWriteInput: RecipeVersionWriteInput;
  comparableSnapshot: RecipeVersionComparableSnapshot;
  diffSummaryJson: RecipeVersionDiffSummaryJson | null;
};
