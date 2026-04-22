import { z } from "zod";

const uuidSchema = z.string().uuid("id 格式无效");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function uniqueUuidArray(fieldName: string) {
  return z
    .array(uuidSchema)
    .max(9, `${fieldName} 最多支持 9 个`)
    .superRefine((value, ctx) => {
      const seen = new Set<string>();

      value.forEach((item, index) => {
        if (seen.has(item)) {
          ctx.addIssue({
            code: "custom",
            message: `${fieldName} 不能重复`,
            path: [index],
          });
          return;
        }

        seen.add(item);
      });
    });
}

const nullableTrimmedText = (fieldName: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} 不能为空`)
    .max(max, `${fieldName} 不能超过 ${max} 个字符`)
    .nullable()
    .optional();

const nullableRating = (fieldName: string) =>
  z.number().int(`${fieldName} 必须为整数`).min(1, `${fieldName} 不能小于 1`).max(5, `${fieldName} 不能大于 5`).nullable().optional();

export const recipeMomentParamsSchema = z.object({
  id: uuidSchema,
});

export const momentIdParamsSchema = z.object({
  id: uuidSchema,
});

export const momentListQuerySchema = z.object({
  page: z.coerce.number().int("page 必须为整数").min(1, "page 不能小于 1").default(1),
  pageSize: z.coerce
    .number()
    .int("pageSize 必须为整数")
    .min(1, "pageSize 不能小于 1")
    .max(100, "pageSize 不能超过 100")
    .default(20),
});

export const latestMomentsQuerySchema = z.object({
  limit: z.coerce.number().int("limit 必须为整数").min(1, "limit 不能小于 1").max(50, "limit 不能超过 50").default(10),
});

export const momentCreateBodySchema = z.object({
  recipeVersionId: uuidSchema.nullable().optional(),
  occurredOn: z.string().regex(datePattern, "occurredOn 格式必须为 YYYY-MM-DD"),
  content: nullableTrimmedText("content", 5000),
  participantsText: nullableTrimmedText("participantsText", 200),
  tasteRating: nullableRating("tasteRating"),
  difficultyRating: nullableRating("difficultyRating"),
  isCoverCandidate: z.boolean().optional(),
  imageAssetIds: uniqueUuidArray("imageAssetIds").optional(),
});

export const momentUpdateBodySchema = z
  .object({
    recipeVersionId: uuidSchema.nullable().optional(),
    occurredOn: z.string().regex(datePattern, "occurredOn 格式必须为 YYYY-MM-DD").optional(),
    content: nullableTrimmedText("content", 5000),
    participantsText: nullableTrimmedText("participantsText", 200),
    tasteRating: nullableRating("tasteRating"),
    difficultyRating: nullableRating("difficultyRating"),
    isCoverCandidate: z.boolean().optional(),
    imageAssetIds: uniqueUuidArray("imageAssetIds").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "至少需要提供一个要更新的字段",
  });
