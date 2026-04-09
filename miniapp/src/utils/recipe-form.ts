import type { CreateRecipePayload, CreateVersionPayload } from '@/services/types/recipe'

interface BaseRecipeFormInput {
  versionName: string
  selectedCategoryId: string | null
  newCategoryName: string
  selectedTagIds: string[]
  newTagNamesInput: string
  ingredients: string[]
  steps: string[]
  tips: string
}

interface CreateRecipeFormInput extends BaseRecipeFormInput {
  name: string
}

interface CreateVersionFormInput extends BaseRecipeFormInput {
  sourceVersionId: string
}

type ValidationSuccess<T> = {
  success: true
  data: T
}

type ValidationFailure = {
  success: false
  message: string
}

function splitTagNames(value: string) {
  return value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeIngredients(values: string[]) {
  return values
    .map((rawText) => rawText.trim())
    .filter(Boolean)
    .map((rawText) => ({ rawText }))
}

function normalizeSteps(values: string[]) {
  return values
    .map((content) => content.trim())
    .filter(Boolean)
    .map((content, index) => ({
      sortOrder: index + 1,
      content
    }))
}

function dedupe(values: string[]) {
  return [...new Set(values)]
}

function validateCommonFields(input: BaseRecipeFormInput): ValidationFailure | null {
  const versionName = input.versionName.trim()
  const newCategoryName = input.newCategoryName.trim()
  const newTagNames = splitTagNames(input.newTagNamesInput)
  const ingredients = normalizeIngredients(input.ingredients)
  const steps = normalizeSteps(input.steps)
  const tips = input.tips.trim()

  if (versionName.length > 100) {
    return { success: false, message: '版本名称不能超过 100 个字符' }
  }

  if (input.selectedCategoryId && newCategoryName) {
    return { success: false, message: '分类和新分类不能同时填写' }
  }

  if (newCategoryName.length > 50) {
    return { success: false, message: '新分类名称不能超过 50 个字符' }
  }

  if (newTagNames.some((item) => item.length > 50)) {
    return { success: false, message: '单个新标签名称不能超过 50 个字符' }
  }

  if (dedupe(newTagNames).length !== newTagNames.length) {
    return { success: false, message: '新标签不能重复' }
  }

  if (ingredients.some((item) => item.rawText.length > 200)) {
    return { success: false, message: '单条主料不能超过 200 个字符' }
  }

  if (steps.some((item) => item.content.length > 5000)) {
    return { success: false, message: '单个步骤不能超过 5000 个字符' }
  }

  if (tips.length > 10000) {
    return { success: false, message: '小贴士不能超过 10000 个字符' }
  }

  return null
}

export function validateCreateRecipeForm(
  input: CreateRecipeFormInput
): ValidationSuccess<CreateRecipePayload> | ValidationFailure {
  const name = input.name.trim()

  if (!name) {
    return { success: false, message: '请输入菜谱名称' }
  }

  if (name.length > 120) {
    return { success: false, message: '菜谱名称不能超过 120 个字符' }
  }

  const commonError = validateCommonFields(input)
  if (commonError) {
    return commonError
  }

  const versionName = input.versionName.trim()
  const newCategoryName = input.newCategoryName.trim()
  const newTagNames = splitTagNames(input.newTagNamesInput)
  const ingredients = normalizeIngredients(input.ingredients)
  const steps = normalizeSteps(input.steps)
  const tips = input.tips.trim()

  return {
    success: true,
    data: {
      name,
      ...(input.selectedCategoryId ? { categoryId: input.selectedCategoryId } : {}),
      ...(newCategoryName ? { newCategoryName } : {}),
      tagIds: dedupe(input.selectedTagIds),
      ...(newTagNames.length ? { newTagNames: dedupe(newTagNames) } : {}),
      ...(versionName ? { versionName } : {}),
      ingredients,
      steps,
      ...(tips ? { tips } : {})
    }
  }
}

export function validateCreateVersionForm(
  input: CreateVersionFormInput
): ValidationSuccess<CreateVersionPayload> | ValidationFailure {
  if (!input.sourceVersionId.trim()) {
    return { success: false, message: '缺少来源版本信息，暂时无法发布。' }
  }

  const commonError = validateCommonFields(input)
  if (commonError) {
    return commonError
  }

  const versionName = input.versionName.trim()
  const newCategoryName = input.newCategoryName.trim()
  const newTagNames = splitTagNames(input.newTagNamesInput)
  const ingredients = normalizeIngredients(input.ingredients)
  const steps = normalizeSteps(input.steps)
  const tips = input.tips.trim()

  return {
    success: true,
    data: {
      sourceVersionId: input.sourceVersionId.trim(),
      ...(versionName ? { versionName } : {}),
      ...(input.selectedCategoryId ? { categoryId: input.selectedCategoryId } : {}),
      ...(newCategoryName ? { newCategoryName } : {}),
      tagIds: dedupe(input.selectedTagIds),
      ...(newTagNames.length ? { newTagNames: dedupe(newTagNames) } : {}),
      ingredients,
      steps,
      ...(tips ? { tips } : {})
    }
  }
}
