import { z } from "zod";

export const taxonomyIdParamSchema = z.object({
  id: z.string().uuid("id 格式无效"),
});

export const taxonomyListQuerySchema = z.object({
  includeArchived: z.coerce.boolean().optional().default(false),
});

export const categoryCreateBodySchema = z.object({
  name: z.string().trim().min(1, "分类名称不能为空").max(50, "分类名称不能超过 50 个字符"),
  color: z
    .string()
    .trim()
    .min(1, "分类颜色不能为空")
    .max(20, "分类颜色不能超过 20 个字符")
    .optional(),
  sortOrder: z
    .number()
    .int("sortOrder 必须为整数")
    .min(0, "sortOrder 不能小于 0")
    .optional(),
});

export const categoryUpdateBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "分类名称不能为空")
      .max(50, "分类名称不能超过 50 个字符")
      .optional(),
    color: z
      .string()
      .trim()
      .min(1, "分类颜色不能为空")
      .max(20, "分类颜色不能超过 20 个字符")
      .nullable()
      .optional(),
    sortOrder: z
      .number()
      .int("sortOrder 必须为整数")
      .min(0, "sortOrder 不能小于 0")
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "至少需要提供一个要更新的字段",
  });

export const tagCreateBodySchema = z.object({
  name: z.string().trim().min(1, "标签名称不能为空").max(50, "标签名称不能超过 50 个字符"),
  sortOrder: z
    .number()
    .int("sortOrder 必须为整数")
    .min(0, "sortOrder 不能小于 0")
    .optional(),
});

export const tagUpdateBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "标签名称不能为空")
      .max(50, "标签名称不能超过 50 个字符")
      .optional(),
    sortOrder: z
      .number()
      .int("sortOrder 必须为整数")
      .min(0, "sortOrder 不能小于 0")
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "至少需要提供一个要更新的字段",
  });

export const taxonomyReorderBodySchema = z
  .object({
    items: z
      .array(
        z.object({
          id: z.string().uuid("id 格式无效"),
          sortOrder: z
            .number()
            .int("sortOrder 必须为整数")
            .min(0, "sortOrder 不能小于 0"),
        }),
      )
      .min(1, "至少需要一项排序数据"),
  })
  .superRefine((value, ctx) => {
    const ids = new Set<string>();

    value.items.forEach((item, index) => {
      if (ids.has(item.id)) {
        ctx.addIssue({
          code: "custom",
          message: "排序项不能重复",
          path: ["items", index, "id"],
        });
        return;
      }

      ids.add(item.id);
    });
  });
