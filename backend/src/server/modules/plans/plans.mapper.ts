import type {
  MealPlanItemDto,
  MealPlanRecipeSummaryDto,
  MealPlanRecipeVersionSummaryDto,
  MealPlanWeekDto,
} from "@/server/modules/plans/plans.types";
import type { MealPlanWeekDetailRecord } from "@/server/modules/plans/plans.repository";

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function mapMealPlanRecipeSummaryDto(
  record: MealPlanWeekDetailRecord["items"][number]["recipe"],
): MealPlanRecipeSummaryDto {
  return {
    id: record.id,
    name: record.name,
    coverImageUrl: record.coverImage?.assetUrl ?? null,
    status: record.status,
    isDeleted: record.deletedAt !== null,
  };
}

function mapMealPlanRecipeVersionSummaryDto(
  record: MealPlanWeekDetailRecord["items"][number]["recipeVersion"],
): MealPlanRecipeVersionSummaryDto {
  return {
    id: record.id,
    versionNumber: record.versionNumber,
    versionName: record.versionName,
  };
}

export function mapMealPlanItemDto(
  record: MealPlanWeekDetailRecord["items"][number],
): MealPlanItemDto {
  return {
    id: record.id,
    plannedDate: toDateString(record.plannedDate),
    mealSlot: record.mealSlot as MealPlanItemDto["mealSlot"],
    sortOrder: record.sortOrder,
    sourceType: record.sourceType as MealPlanItemDto["sourceType"],
    note: record.note,
    recipe: mapMealPlanRecipeSummaryDto(record.recipe),
    recipeVersion: mapMealPlanRecipeVersionSummaryDto(record.recipeVersion),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapMealPlanWeekDto(record: MealPlanWeekDetailRecord): MealPlanWeekDto {
  return {
    id: record.id,
    weekStartDate: toDateString(record.weekStartDate),
    status: record.status as MealPlanWeekDto["status"],
    plannedItemCount: record.items.length,
    items: record.items.map(mapMealPlanItemDto),
  };
}
