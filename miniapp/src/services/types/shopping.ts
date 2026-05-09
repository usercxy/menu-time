export type ShoppingListGeneratedFrom = 'manual' | 'auto_refresh'
export type ShoppingListStatus = 'active' | 'archived'
export type ShoppingListItemType = 'ingredient' | 'seasoning'

export interface ShoppingListGeneratePayload {
  weekStartDate: string
  generatedFrom?: ShoppingListGeneratedFrom
}

export interface ShoppingListGenerateResultDTO {
  shoppingListId: string
  versionNo: number
  archivedListIds: string[]
}

export interface ShoppingListSourceRecipeRefDTO {
  mealPlanItemId: string
  plannedDate: string
  mealSlot: string
  recipeId: string
  recipeName: string
  recipeVersionId: string
  versionNumber: number
  versionName: string | null
}

export interface ShoppingListItemDTO {
  id: string
  itemType: ShoppingListItemType
  displayName: string
  normalizedName: string
  quantityNote: string | null
  sourceCount: number
  isChecked: boolean
  sortOrder: number
  sourceRecipeRefs: ShoppingListSourceRecipeRefDTO[]
  createdAt: string
  updatedAt: string
}

export interface ShoppingListDetailDTO {
  id: string
  weekStartDate: string
  generatedFrom: ShoppingListGeneratedFrom
  status: ShoppingListStatus
  versionNo: number
  generatedAt: string
  menuLastUpdatedAt: string | null
  menuChangedAfterGenerated: boolean
  totalItemCount: number
  checkedItemCount: number
  ingredientItems: ShoppingListItemDTO[]
  seasoningItems: ShoppingListItemDTO[]
}

export interface ShoppingListItemUpdatePayload {
  isChecked?: boolean
  quantityNote?: string | null
}

export interface ShoppingListCopyTextResultDTO {
  text: string
}

export interface ShoppingListShareImageResultDTO {
  taskAccepted: boolean
  imageAssetId: string | null
  imageDataUrl: string
  mimeType: string
}
