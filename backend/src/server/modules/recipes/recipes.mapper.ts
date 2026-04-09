import type {
  Category,
  RecipeVersionIngredient,
  RecipeVersionStep,
  Tag,
} from "@prisma/client";

import type {
  RecipeCategoryDto,
  RecipeCurrentVersionDto,
  RecipeDetailDto,
  RecipeIngredientDto,
  RecipeListItemDto,
  RecipeStepDto,
  RecipeTagDto,
  RecipeVersionCompareDto,
  RecipeVersionDetailDto,
  RecipeVersionListItemDto,
} from "@/server/modules/recipes/recipes.types";
import type { RecipeVersionComparableSnapshot } from "@/server/lib/diff";
import type {
  RecipeDetailRecord,
  RecipeListRecord,
  RecipeVersionDetailRecord,
  RecipeVersionListRecord,
} from "@/server/modules/recipes/recipes.repository";

type CategoryRecord = Pick<Category, "id" | "name" | "color">;
type TagRecord = Pick<Tag, "id" | "name" | "sortOrder">;
type StepRecord = Pick<RecipeVersionStep, "sortOrder" | "content">;
type IngredientRecord = Pick<
  RecipeVersionIngredient,
  "sortOrder" | "rawText" | "normalizedName" | "amountText" | "unit" | "isSeasoning" | "parseSource"
>;

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toDateString(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function mapRecipeCategoryDto(
  record: CategoryRecord | null | undefined,
): RecipeCategoryDto | null {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    color: record.color,
  };
}

export function mapRecipeTagDto(record: TagRecord): RecipeTagDto {
  return {
    id: record.id,
    name: record.name,
    sortOrder: record.sortOrder,
  };
}

export function mapRecipeTagListDto(records: TagRecord[]) {
  return [...records]
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "zh-CN"),
    )
    .map(mapRecipeTagDto);
}

export function mapRecipeStepDto(record: StepRecord): RecipeStepDto {
  return {
    sortOrder: record.sortOrder,
    content: record.content,
  };
}

export function mapRecipeIngredientDto(
  record: IngredientRecord,
): RecipeIngredientDto {
  return {
    sortOrder: record.sortOrder,
    rawText: record.rawText,
    normalizedName: record.normalizedName,
    amountText: record.amountText,
    unit: record.unit,
    isSeasoning: record.isSeasoning,
    parseSource: record.parseSource,
  };
}

function mapCurrentVersionSummary(
  record: RecipeListRecord["currentVersion"],
): RecipeCurrentVersionDto | null {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    versionNumber: record.versionNumber,
    versionName: record.versionName,
    category: mapRecipeCategoryDto(record.category),
    tags: mapRecipeTagListDto(record.tagLinks.map((tagLink) => tagLink.tag)),
  };
}

export function mapRecipeListItemDto(record: RecipeListRecord): RecipeListItemDto {
  return {
    id: record.id,
    name: record.name,
    coverImageUrl: record.coverImage?.assetUrl ?? null,
    currentVersion: mapCurrentVersionSummary(record.currentVersion),
    versionCount: record.versionCount,
    momentCount: record.momentCount,
    latestMomentAt: toIsoString(record.latestMomentAt),
    latestCookedAt: toDateString(record.latestCookedAt),
  };
}

export function mapRecipeListDto(records: RecipeListRecord[]) {
  return records.map(mapRecipeListItemDto);
}

export function mapRecipeVersionListItemDto(
  record: RecipeVersionListRecord,
): RecipeVersionListItemDto {
  return {
    id: record.id,
    versionNumber: record.versionNumber,
    versionName: record.versionName,
    isCurrent: record.recipe.currentVersionId === record.id,
    diffSummaryText: record.diffSummaryText,
    createdAt: record.createdAt.toISOString(),
  };
}

export function mapRecipeVersionListDto(records: RecipeVersionListRecord[]) {
  return records.map(mapRecipeVersionListItemDto);
}

export function mapRecipeVersionDetailDto(
  record: RecipeVersionDetailRecord,
): RecipeVersionDetailDto {
  return {
    id: record.id,
    versionNumber: record.versionNumber,
    versionName: record.versionName,
    sourceVersionId: record.sourceVersionId,
    isCurrent: record.recipe.currentVersionId === record.id,
    diffSummaryText: record.diffSummaryText,
    diffSummaryJson: (record.diffSummaryJson as RecipeVersionDetailDto["diffSummaryJson"]) ?? null,
    category: mapRecipeCategoryDto(record.category),
    tags: mapRecipeTagListDto(record.tagLinks.map((tagLink) => tagLink.tag)),
    ingredientsText: record.ingredientsText,
    ingredients: record.ingredients.map(mapRecipeIngredientDto),
    steps: record.steps.map(mapRecipeStepDto),
    tips: record.tips,
    createdAt: record.createdAt.toISOString(),
  };
}

export function mapRecipeDetailDto(record: RecipeDetailRecord): RecipeDetailDto {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    coverImageUrl: record.coverImage?.assetUrl ?? null,
    coverSource: record.coverSource,
    versionCount: record.versionCount,
    momentCount: record.momentCount,
    latestMomentAt: toIsoString(record.latestMomentAt),
    latestCookedAt: toDateString(record.latestCookedAt),
    status: record.status,
    currentVersion: record.currentVersion
      ? mapRecipeVersionDetailDto({
          ...record.currentVersion,
          recipe: {
            currentVersionId: record.currentVersionId,
          },
        })
      : null,
  };
}

export function mapRecipeVersionToComparableSnapshot(
  record: Pick<
    RecipeVersionDetailRecord,
    "ingredientsText" | "ingredients" | "steps" | "tagLinks"
  >,
): RecipeVersionComparableSnapshot {
  return {
    ingredientsText: record.ingredientsText,
    ingredients: record.ingredients.map((ingredient) => ({
      sortOrder: ingredient.sortOrder,
      rawText: ingredient.rawText,
    })),
    steps: record.steps.map((step) => ({
      sortOrder: step.sortOrder,
      content: step.content,
    })),
    tags: record.tagLinks.map((tagLink) => ({
      id: tagLink.tag.id,
      name: tagLink.tag.name,
    })),
  };
}

export function mapRecipeVersionCompareDto(input: {
  baseVersion: RecipeVersionDetailRecord;
  targetVersion: RecipeVersionDetailRecord;
  summaryText: string;
  summaryJson: RecipeVersionCompareDto["summaryJson"];
}): RecipeVersionCompareDto {
  return {
    baseVersion: {
      id: input.baseVersion.id,
      versionNumber: input.baseVersion.versionNumber,
      versionName: input.baseVersion.versionName,
    },
    targetVersion: {
      id: input.targetVersion.id,
      versionNumber: input.targetVersion.versionNumber,
      versionName: input.targetVersion.versionName,
    },
    summaryText: input.summaryText,
    summaryJson: input.summaryJson,
  };
}
