export type RecipeVersionComparableTag = {
  id?: string;
  name: string;
};

export type RecipeVersionComparableStep = {
  sortOrder?: number;
  content: string;
};

export type RecipeVersionComparableIngredient = {
  sortOrder?: number;
  rawText: string;
};

export type RecipeVersionComparableSnapshot = {
  ingredientsText?: string | null;
  ingredients?: RecipeVersionComparableIngredient[];
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

function normalizeIngredients(ingredients?: RecipeVersionComparableIngredient[]) {
  return (ingredients ?? [])
    .map((ingredient) => ingredient.rawText.trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeSteps(steps?: RecipeVersionComparableStep[]) {
  return (steps ?? [])
    .map((step) => ({
      sortOrder: step.sortOrder ?? 0,
      content: step.content.trim(),
    }))
    .filter((step) => step.content.length > 0)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.content.localeCompare(right.content, "zh-CN"),
    );
}

export function buildRecipeVersionDiffSummary(input: {
  base?: RecipeVersionComparableSnapshot | null;
  target: RecipeVersionComparableSnapshot;
}): RecipeVersionDiffSummaryJson {
  const baseIngredientsText = normalizeText(input.base?.ingredientsText);
  const targetIngredientsText = normalizeText(input.target.ingredientsText);
  const baseIngredientsList = normalizeIngredients(input.base?.ingredients);
  const targetIngredientsList = normalizeIngredients(input.target.ingredients);
  const ingredientsChanged =
    baseIngredientsText !== targetIngredientsText ||
    baseIngredientsList !== targetIngredientsList;

  const baseTagNames = normalizeTagNames(input.base?.tags);
  const targetTagNames = normalizeTagNames(input.target.tags);
  const addedTags = targetTagNames.filter((tagName) => !baseTagNames.includes(tagName));
  const removedTags = baseTagNames.filter((tagName) => !targetTagNames.includes(tagName));

  const stepCountBefore = normalizeSteps(input.base?.steps).length;
  const stepCountAfter = normalizeSteps(input.target.steps).length;
  const stepContentChanged =
    JSON.stringify(normalizeSteps(input.base?.steps)) !==
    JSON.stringify(normalizeSteps(input.target.steps));

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
  } else if (stepContentChanged) {
    summaryParts.push("步骤内容有调整");
  }

  const summary =
    summaryParts.length > 0 ? summaryParts.join("；") : "未检测到主料、标签和步骤变化";

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
