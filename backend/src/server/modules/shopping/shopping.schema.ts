import { z } from "zod";

const uuidSchema = z.string().uuid("id 格式无效");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const nullableTrimmedText = (fieldName: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${fieldName} 不能超过 ${max} 个字符`)
    .transform((value) => value || null)
    .nullable()
    .optional();

export const shoppingListParamsSchema = z.object({
  id: uuidSchema,
});

export const shoppingListItemParamsSchema = z.object({
  id: uuidSchema,
});

export const shoppingListGenerateBodySchema = z.object({
  weekStartDate: z.string().regex(datePattern, "weekStartDate 格式必须为 YYYY-MM-DD"),
  generatedFrom: z.enum(["manual", "auto_refresh"]).optional(),
});

export const shoppingListItemUpdateBodySchema = z
  .object({
    isChecked: z.boolean().optional(),
    quantityNote: nullableTrimmedText("quantityNote", 50),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "至少需要提供一个要更新的字段",
  });
