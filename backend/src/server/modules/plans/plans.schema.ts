import { z } from "zod";

const uuidSchema = z.string().uuid("id 格式无效");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const mealSlotSchema = z.enum(["lunch", "dinner", "extra"]);
const sourceTypeSchema = z.enum(["manual", "random"]);

const nullableTrimmedText = (fieldName: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} 不能为空`)
    .max(max, `${fieldName} 不能超过 ${max} 个字符`)
    .nullable()
    .optional();

export const mealPlanWeekParamsSchema = z.object({
  weekStartDate: z.string().regex(datePattern, "weekStartDate 格式必须为 YYYY-MM-DD"),
});

export const mealPlanItemParamsSchema = z.object({
  id: uuidSchema,
});

export const mealPlanItemCreateBodySchema = z.object({
  recipeId: uuidSchema,
  recipeVersionId: uuidSchema,
  plannedDate: z.string().regex(datePattern, "plannedDate 格式必须为 YYYY-MM-DD"),
  mealSlot: mealSlotSchema,
  note: nullableTrimmedText("note", 200),
  sourceType: sourceTypeSchema.optional(),
});

export const mealPlanItemUpdateBodySchema = z
  .object({
    recipeVersionId: uuidSchema.optional(),
    plannedDate: z.string().regex(datePattern, "plannedDate 格式必须为 YYYY-MM-DD").optional(),
    mealSlot: mealSlotSchema.optional(),
    note: nullableTrimmedText("note", 200),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "至少需要提供一个要更新的字段",
  });

export const mealPlanReorderBodySchema = z.object({
  plannedDate: z.string().regex(datePattern, "plannedDate 格式必须为 YYYY-MM-DD"),
  mealSlot: mealSlotSchema,
  items: z
    .array(
      z.object({
        id: uuidSchema,
        sortOrder: z.number().int("sortOrder 必须为整数").min(0, "sortOrder 不能小于 0"),
      }),
    )
    .min(1, "items 不能为空")
    .superRefine((value, ctx) => {
      const seen = new Set<string>();

      value.forEach((item, index) => {
        if (seen.has(item.id)) {
          ctx.addIssue({
            code: "custom",
            message: "items 不能包含重复 id",
            path: [index, "id"],
          });
          return;
        }

        seen.add(item.id);
      });
    }),
});
