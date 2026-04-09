export type RecipeVersionComparableTag = {
  id?: string;
  name: string;
};

export type RecipeVersionComparableStep = {
  sortOrder?: number;
  content: string;
};

export type RecipeVersionComparableSnapshot = {
  ingredientsText?: string | null;
  tags?: RecipeVersionComparableTag[];
  steps?: RecipeVersionComparableStep[];
};

export type RecipeVersionDiffSummaryJson = {
  ingredientsChanged: boolean;
  ingredientsTextBefore: string | null;
  ingredientsTextAfter: string | null;
  addedTags: string[];
  removedTags: string[];
  stepCountBefore: number;
  stepCountAfter: number;
  summary: string;
};

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeTagNames(tags?: RecipeVersionComparableTag[]) {
  return [...new Set((tags ?? []).map((tag) => tag.name.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, "zh-CN"),
  );
}

function normalizeSteps(steps?: RecipeVersionComparableStep[]) {
  return (steps ?? []).filter((step) => step.content.trim().length > 0);
}

export function buildRecipeVersionDiffSummary(input: {
  base?: RecipeVersionComparableSnapshot | null;
  target: RecipeVersionComparableSnapshot;
}): RecipeVersionDiffSummaryJson {
  const baseIngredientsText = normalizeText(input.base?.ingredientsText);
  const targetIngredientsText = normalizeText(input.target.ingredientsText);
  const ingredientsChanged = baseIngredientsText !== targetIngredientsText;

  const baseTagNames = normalizeTagNames(input.base?.tags);
  const targetTagNames = normalizeTagNames(input.target.tags);
  const addedTags = targetTagNames.filter((tagName) => !baseTagNames.includes(tagName));
  const removedTags = baseTagNames.filter((tagName) => !targetTagNames.includes(tagName));

  const stepCountBefore = normalizeSteps(input.base?.steps).length;
  const stepCountAfter = normalizeSteps(input.target.steps).length;

  const summaryParts: string[] = [];

  if (ingredientsChanged) {
    summaryParts.push("主料有调整");
  }

  if (addedTags.length > 0) {
    summaryParts.push(`新增标签：${addedTags.join("、")}`);
  }

  if (removedTags.length > 0) {
    summaryParts.push(`移除标签：${removedTags.join("、")}`);
  }

  if (stepCountBefore !== stepCountAfter) {
    summaryParts.push(`步骤数由 ${stepCountBefore} 步调整为 ${stepCountAfter} 步`);
  }

  const summary =
    summaryParts.length > 0 ? summaryParts.join("；") : "未检测到主料、标签和步骤数变化";

  return {
    ingredientsChanged,
    ingredientsTextBefore: baseIngredientsText,
    ingredientsTextAfter: targetIngredientsText,
    addedTags,
    removedTags,
    stepCountBefore,
    stepCountAfter,
    summary,
  };
}
