export type ShoppingListGeneratedFrom = "manual" | "auto_refresh";
export type ShoppingListStatus = "active" | "archived";
export type ShoppingListItemType = "ingredient" | "seasoning";

export type HouseholdScopedInput = {
  householdId: string;
};

export type ShoppingListIdInput = HouseholdScopedInput & {
  id: string;
};

export type ShoppingListItemIdInput = HouseholdScopedInput & {
  id: string;
};

export type ShoppingListGeneratePayload = {
  weekStartDate: string;
  generatedFrom?: ShoppingListGeneratedFrom;
};

export type ShoppingListItemUpdatePayload = {
  isChecked?: boolean;
  quantityNote?: string | null;
};

export type ShoppingListSourceRecipeRefDto = {
  mealPlanItemId: string;
  plannedDate: string;
  mealSlot: string;
  recipeId: string;
  recipeName: string;
  recipeVersionId: string;
  versionNumber: number;
  versionName: string | null;
};

export type ShoppingListItemDto = {
  id: string;
  itemType: ShoppingListItemType;
  displayName: string;
  normalizedName: string;
  quantityNote: string | null;
  sourceCount: number;
  isChecked: boolean;
  sortOrder: number;
  sourceRecipeRefs: ShoppingListSourceRecipeRefDto[];
  createdAt: string;
  updatedAt: string;
};

export type ShoppingListDetailDto = {
  id: string;
  weekStartDate: string;
  generatedFrom: ShoppingListGeneratedFrom;
  status: ShoppingListStatus;
  versionNo: number;
  generatedAt: string;
  menuLastUpdatedAt: string | null;
  menuChangedAfterGenerated: boolean;
  totalItemCount: number;
  checkedItemCount: number;
  ingredientItems: ShoppingListItemDto[];
  seasoningItems: ShoppingListItemDto[];
};

export type ShoppingListGenerateResultDto = {
  shoppingListId: string;
  versionNo: number;
  archivedListIds: string[];
};

export type ShoppingListCopyTextResultDto = {
  text: string;
};

export type ShoppingListShareImageResultDto = {
  taskAccepted: boolean;
  imageAssetId: string | null;
  imageDataUrl: string;
  mimeType: string;
};
