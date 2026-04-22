export type MealSlot = "lunch" | "dinner" | "extra";
export type MealPlanWeekStatus = "draft" | "finalized";
export type MealPlanSourceType = "manual" | "random";

export type HouseholdScopedInput = {
  householdId: string;
};

export type MealPlanWeekKeyInput = HouseholdScopedInput & {
  weekStartDate: string;
};

export type MealPlanItemIdInput = HouseholdScopedInput & {
  id: string;
};

export type MealPlanItemCreatePayload = {
  recipeId: string;
  recipeVersionId: string;
  plannedDate: string;
  mealSlot: MealSlot;
  note?: string | null;
  sourceType?: MealPlanSourceType;
};

export type MealPlanItemUpdatePayload = {
  recipeVersionId?: string;
  plannedDate?: string;
  mealSlot?: MealSlot;
  note?: string | null;
};

export type MealPlanReorderPayload = {
  plannedDate: string;
  mealSlot: MealSlot;
  items: Array<{
    id: string;
    sortOrder: number;
  }>;
};

export type MealPlanRecipeSummaryDto = {
  id: string;
  name: string;
  coverImageUrl: string | null;
  status: string;
  isDeleted: boolean;
};

export type MealPlanRecipeVersionSummaryDto = {
  id: string;
  versionNumber: number;
  versionName: string | null;
};

export type MealPlanItemDto = {
  id: string;
  plannedDate: string;
  mealSlot: MealSlot;
  sortOrder: number;
  sourceType: MealPlanSourceType;
  note: string | null;
  recipe: MealPlanRecipeSummaryDto;
  recipeVersion: MealPlanRecipeVersionSummaryDto;
  createdAt: string;
  updatedAt: string;
};

export type MealPlanWeekDto = {
  id: string;
  weekStartDate: string;
  status: MealPlanWeekStatus;
  plannedItemCount: number;
  items: MealPlanItemDto[];
};

export type MealPlanMutationResultDto = {
  id: string;
};

export type DeleteMealPlanItemResultDto = {
  deleted: true;
};
