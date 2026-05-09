import { z } from "zod";

const uuidSchema = z.string().uuid("id 格式无效");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const stringArraySchema = (fieldName: string) =>
  z
    .array(uuidSchema)
    .max(20, `${fieldName} 不能超过 20 项`)
    .superRefine((value, ctx) => {
      const seen = new Set<string>();

      value.forEach((item, index) => {
        if (seen.has(item)) {
          ctx.addIssue({
            code: "custom",
            message: `${fieldName} 不能包含重复 id`,
            path: [index],
          });
          return;
        }

        seen.add(item);
      });
    });

const preferredMemberTagsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "preferredMemberTags 不能为空")
      .max(50, "preferredMemberTags 单项不能超过 50 个字符"),
  )
  .max(10, "preferredMemberTags 不能超过 10 项")
  .optional();

const nullableTrimmedText = (fieldName: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${fieldName} 不能超过 ${max} 个字符`)
    .transform((value) => value || null)
    .nullable()
    .optional();

export const randomPickSessionParamsSchema = z.object({
  id: uuidSchema,
});

export const randomPickResultParamsSchema = z.object({
  id: uuidSchema,
  resultId: uuidSchema,
});

export const randomPickFiltersSchema = z.object({
  categoryIds: stringArraySchema("categoryIds").optional(),
  tagIds: stringArraySchema("tagIds").optional(),
  maxDifficulty: z
    .number()
    .int("maxDifficulty 必须为整数")
    .min(1, "maxDifficulty 不能小于 1")
    .max(5, "maxDifficulty 不能大于 5")
    .optional(),
  excludeRecentDays: z
    .number()
    .int("excludeRecentDays 必须为整数")
    .min(0, "excludeRecentDays 不能小于 0")
    .max(365, "excludeRecentDays 不能大于 365")
    .optional(),
  excludeCurrentWeekPlanned: z.boolean().optional(),
  preferredMemberTags: preferredMemberTagsSchema,
});

export const randomPickSessionCreateBodySchema = z.object({
  mode: z.enum(["single", "week"]),
  weekStartDate: z
    .string()
    .regex(datePattern, "weekStartDate 格式必须为 YYYY-MM-DD")
    .optional(),
  filters: randomPickFiltersSchema.optional(),
});

export const randomPickResultAcceptBodySchema = z
  .object({
    plannedDate: z
      .string()
      .regex(datePattern, "plannedDate 格式必须为 YYYY-MM-DD")
      .optional(),
    mealSlot: z.enum(["lunch", "dinner", "extra"]).optional(),
    recipeVersionId: uuidSchema.optional(),
    note: nullableTrimmedText("note", 200),
  });
