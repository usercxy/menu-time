import { z } from "zod";

const uuidSchema = z.string().uuid("id 格式无效");

function parseCsvUuidList(fieldName: string) {
  return z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value) {
        return [];
      }

      const items = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      items.forEach((item, index) => {
        if (!uuidSchema.safeParse(item).success) {
          ctx.addIssue({
            code: "custom",
            message: `${fieldName} 中存在无效 id`,
            path: [index],
          });
        }
      });

      if (ctx.issues.length > 0) {
        return z.NEVER;
      }

      return [...new Set(items)];
    });
}

function dedupeStringArray(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

const recipeStatusSchema = z.enum(["active", "archived"]);
const coverSourceSchema = z.enum(["custom", "moment_latest", "none"]);

const recipeStepSchema = z.object({
  sortOrder: z
    .number()
    .int("sortOrder 必须为整数")
    .min(0, "sortOrder 不能小于 0")
    .optional(),
  content: z.string().trim().min(1, "步骤内容不能为空").max(5000, "步骤内容不能超过 5000 个字符"),
});

const recipeIngredientSchema = z.object({
  sortOrder: z
    .number()
    .int("sortOrder 必须为整数")
    .min(0, "sortOrder 不能小于 0")
    .optional(),
  rawText: z.string().trim().min(1, "食材内容不能为空").max(200, "食材内容不能超过 200 个字符"),
  normalizedName: z
    .string()
    .trim()
    .min(1, "normalizedName 不能为空")
    .max(100, "normalizedName 不能超过 100 个字符")
    .nullable()
    .optional(),
  amountText: z
    .string()
    .trim()
    .min(1, "amountText 不能为空")
    .max(50, "amountText 不能超过 50 个字符")
    .nullable()
    .optional(),
  unit: z
    .string()
    .trim()
    .min(1, "unit 不能为空")
    .max(20, "unit 不能超过 20 个字符")
    .nullable()
    .optional(),
  isSeasoning: z.boolean().optional(),
  parseSource: z.enum(["manual", "rule"]).optional(),
});

const recipeTaxonomySchema = z
  .object({
    categoryId: uuidSchema.optional(),
    newCategoryName: z
      .string()
      .trim()
      .min(1, "newCategoryName 不能为空")
      .max(50, "newCategoryName 不能超过 50 个字符")
      .optional(),
    tagIds: z.array(uuidSchema).optional(),
    newTagNames: z
      .array(
        z.string().trim().min(1, "newTagNames 不能为空").max(50, "newTagNames 不能超过 50 个字符"),
      )
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.categoryId && value.newCategoryName) {
      ctx.addIssue({
        code: "custom",
        message: "categoryId 与 newCategoryName 不能同时传入",
        path: ["newCategoryName"],
      });
    }

    const tagIds = new Set<string>();
    (value.tagIds ?? []).forEach((tagId, index) => {
      if (tagIds.has(tagId)) {
        ctx.addIssue({
          code: "custom",
          message: "tagIds 不能重复",
          path: ["tagIds", index],
        });
        return;
      }

      tagIds.add(tagId);
    });

    const tagNames = new Set<string>();
    (value.newTagNames ?? []).forEach((tagName, index) => {
      const normalized = tagName.trim();

      if (tagNames.has(normalized)) {
        ctx.addIssue({
          code: "custom",
          message: "newTagNames 不能重复",
          path: ["newTagNames", index],
        });
        return;
      }

      tagNames.add(normalized);
    });
  });

export const recipeIdParamSchema = z.object({
  id: uuidSchema,
});

export const recipeVersionParamsSchema = z.object({
  id: uuidSchema,
  versionId: uuidSchema,
});

export const recipeListQuerySchema = z.object({
  page: z.coerce.number().int("page 必须为整数").min(1, "page 不能小于 1").default(1),
  pageSize: z.coerce
    .number()
    .int("pageSize 必须为整数")
    .min(1, "pageSize 不能小于 1")
    .max(100, "pageSize 不能超过 100")
    .default(20),
  keyword: z.string().trim().max(120, "keyword 不能超过 120 个字符").optional(),
  categoryId: uuidSchema.optional(),
  tagIds: parseCsvUuidList("tagIds"),
  sortBy: z.enum(["updatedAt", "latestMomentAt", "name"]).default("updatedAt"),
});

export const recipeVersionsListQuerySchema = z.object({
  page: z.coerce.number().int("page 必须为整数").min(1, "page 不能小于 1").default(1),
  pageSize: z.coerce
    .number()
    .int("pageSize 必须为整数")
    .min(1, "pageSize 不能小于 1")
    .max(100, "pageSize 不能超过 100")
    .default(20),
});

export const recipeCreateBodySchema = recipeTaxonomySchema.extend({
  name: z.string().trim().min(1, "菜谱名称不能为空").max(120, "菜谱名称不能超过 120 个字符"),
  slug: z
    .string()
    .trim()
    .min(1, "slug 不能为空")
    .max(160, "slug 不能超过 160 个字符")
    .nullable()
    .optional(),
  versionName: z
    .string()
    .trim()
    .min(1, "versionName 不能为空")
    .max(100, "versionName 不能超过 100 个字符")
    .nullable()
    .optional(),
  ingredientsText: z
    .string()
    .trim()
    .min(1, "ingredientsText 不能为空")
    .max(10000, "ingredientsText 不能超过 10000 个字符")
    .nullable()
    .optional(),
  ingredients: z.array(recipeIngredientSchema).optional(),
  steps: z.array(recipeStepSchema).optional(),
  tips: z
    .string()
    .trim()
    .min(1, "tips 不能为空")
    .max(10000, "tips 不能超过 10000 个字符")
    .nullable()
    .optional(),
  isMajor: z.boolean().optional(),
});

export const recipeUpdateBodySchema = z
  .object({
    name: z.string().trim().min(1, "菜谱名称不能为空").max(120, "菜谱名称不能超过 120 个字符").optional(),
    slug: z
      .string()
      .trim()
      .min(1, "slug 不能为空")
      .max(160, "slug 不能超过 160 个字符")
      .nullable()
      .optional(),
    coverImageId: uuidSchema.nullable().optional(),
    coverSource: coverSourceSchema.optional(),
    status: recipeStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "至少需要提供一个要更新的字段",
  });

export const recipeVersionCreateBodySchema = recipeTaxonomySchema.extend({
  sourceVersionId: uuidSchema.optional(),
  versionName: z
    .string()
    .trim()
    .min(1, "versionName 不能为空")
    .max(100, "versionName 不能超过 100 个字符")
    .nullable()
    .optional(),
  ingredientsText: z
    .string()
    .trim()
    .min(1, "ingredientsText 不能为空")
    .max(10000, "ingredientsText 不能超过 10000 个字符")
    .nullable()
    .optional(),
  ingredients: z.array(recipeIngredientSchema).optional(),
  steps: z.array(recipeStepSchema).optional(),
  tips: z
    .string()
    .trim()
    .min(1, "tips 不能为空")
    .max(10000, "tips 不能超过 10000 个字符")
    .nullable()
    .optional(),
  isMajor: z.boolean().optional(),
});

export const recipeCompareQuerySchema = z.object({
  base: z.coerce.number().int("base 必须为整数").min(1, "base 不能小于 1"),
  target: z.coerce.number().int("target 必须为整数").min(1, "target 不能小于 1"),
});

export function normalizeRecipeTagNameArray(values: string[]) {
  return dedupeStringArray(values);
}
