import type {
  ShoppingListDetailRecord,
  ShoppingListItemRecord,
} from "@/server/modules/shopping/shopping.repository";
import type {
  ShoppingListDetailDto,
  ShoppingListItemDto,
  ShoppingListSourceRecipeRefDto,
} from "@/server/modules/shopping/shopping.types";

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function mapSourceRecipeRefs(
  value: unknown,
): ShoppingListSourceRecipeRefDto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const ref = item as Record<string, unknown>;

    if (
      typeof ref.mealPlanItemId !== "string" ||
      typeof ref.plannedDate !== "string" ||
      typeof ref.mealSlot !== "string" ||
      typeof ref.recipeId !== "string" ||
      typeof ref.recipeName !== "string" ||
      typeof ref.recipeVersionId !== "string" ||
      typeof ref.versionNumber !== "number"
    ) {
      return [];
    }

    return [
      {
        mealPlanItemId: ref.mealPlanItemId,
        plannedDate: ref.plannedDate,
        mealSlot: ref.mealSlot,
        recipeId: ref.recipeId,
        recipeName: ref.recipeName,
        recipeVersionId: ref.recipeVersionId,
        versionNumber: ref.versionNumber,
        versionName: typeof ref.versionName === "string" ? ref.versionName : null,
      },
    ];
  });
}

export function mapShoppingListItemDto(record: ShoppingListItemRecord): ShoppingListItemDto {
  return {
    id: record.id,
    itemType: record.itemType as ShoppingListItemDto["itemType"],
    displayName: record.displayName,
    normalizedName: record.normalizedName,
    quantityNote: record.quantityNote,
    sourceCount: record.sourceCount,
    isChecked: record.isChecked,
    sortOrder: record.sortOrder,
    sourceRecipeRefs: mapSourceRecipeRefs(record.sourceRecipeRefs),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapShoppingListDetailDto(input: {
  record: ShoppingListDetailRecord;
  menuLastUpdatedAt: Date | null;
}): ShoppingListDetailDto {
  const items: ShoppingListItemDto[] = input.record.items.map(mapShoppingListItemDto);

  return {
    id: input.record.id,
    weekStartDate: toDateString(input.record.mealPlanWeek.weekStartDate),
    generatedFrom: input.record.generatedFrom as ShoppingListDetailDto["generatedFrom"],
    status: input.record.status as ShoppingListDetailDto["status"],
    versionNo: input.record.versionNo,
    generatedAt: input.record.generatedAt.toISOString(),
    menuLastUpdatedAt: input.menuLastUpdatedAt?.toISOString() ?? null,
    menuChangedAfterGenerated:
      input.menuLastUpdatedAt !== null &&
      input.menuLastUpdatedAt.getTime() > input.record.generatedAt.getTime(),
    totalItemCount: items.length,
    checkedItemCount: items.filter((item: ShoppingListItemDto) => item.isChecked).length,
    ingredientItems: items.filter(
      (item: ShoppingListItemDto) => item.itemType === "ingredient",
    ),
    seasoningItems: items.filter(
      (item: ShoppingListItemDto) => item.itemType === "seasoning",
    ),
  };
}
