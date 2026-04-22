import type { PageResult } from "@/server/lib/api/response";

export type HouseholdScopedInput = {
  householdId: string;
};

export type RecipeScopedInput = HouseholdScopedInput & {
  recipeId: string;
};

export type MomentIdInput = HouseholdScopedInput & {
  id: string;
};

export type MomentListInput = RecipeScopedInput & {
  page: number;
  pageSize: number;
};

export type LatestMomentsInput = HouseholdScopedInput & {
  limit: number;
};

export type MomentCreatePayload = {
  recipeVersionId?: string | null;
  occurredOn: string;
  content?: string | null;
  participantsText?: string | null;
  tasteRating?: number | null;
  difficultyRating?: number | null;
  isCoverCandidate?: boolean;
  imageAssetIds?: string[];
};

export type MomentUpdatePayload = {
  recipeVersionId?: string | null;
  occurredOn?: string;
  content?: string | null;
  participantsText?: string | null;
  tasteRating?: number | null;
  difficultyRating?: number | null;
  isCoverCandidate?: boolean;
  imageAssetIds?: string[];
};

export type MomentImageDto = {
  id: string;
  assetId: string;
  assetUrl: string;
  width: number | null;
  height: number | null;
  sortOrder: number;
};

export type MomentRecipeVersionDto = {
  id: string;
  versionNumber: number;
  versionName: string | null;
};

export type MomentItemDto = {
  id: string;
  recipeId: string;
  occurredOn: string;
  content: string | null;
  participantsText: string | null;
  tasteRating: number | null;
  difficultyRating: number | null;
  isCoverCandidate: boolean;
  images: MomentImageDto[];
  recipeVersion: MomentRecipeVersionDto | null;
  createdAt: string;
  updatedAt: string;
};

export type LatestMomentItemDto = {
  momentId: string;
  recipeId: string;
  recipeName: string;
  coverImageUrl: string | null;
  occurredOn: string;
  previewText: string;
};

export type MomentListResultDto = PageResult<MomentItemDto>;

export type LatestMomentsResultDto = {
  items: LatestMomentItemDto[];
};

export type MomentMutationResultDto = {
  id: string;
};

export type DeleteMomentResultDto = {
  deleted: true;
};
