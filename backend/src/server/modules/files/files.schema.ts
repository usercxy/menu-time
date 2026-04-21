import { z } from "zod";

const fileAssetKeyPattern =
  /^households\/[0-9a-f-]+\/files\/images\/\d{4}\/\d{2}\/[0-9a-f-]+\.(jpg|png|webp)$/i;

export const fileIdParamSchema = z.object({
  id: z.string().uuid("id 格式无效"),
});

export const fileUploadTokenBodySchema = z.object({
  fileName: z.string().trim().min(1, "fileName 不能为空").max(255, "fileName 不能超过 255 个字符"),
  contentType: z
    .string()
    .trim()
    .min(1, "contentType 不能为空")
    .max(100, "contentType 不能超过 100 个字符"),
  sizeBytes: z.coerce
    .number()
    .int("sizeBytes 必须为整数")
    .positive("sizeBytes 必须大于 0")
    .max(Number.MAX_SAFE_INTEGER, "sizeBytes 超出支持范围"),
});

export const fileAssetRegisterBodySchema = z.object({
  assetKey: z
    .string()
    .trim()
    .min(1, "assetKey 不能为空")
    .max(255, "assetKey 不能超过 255 个字符")
    .regex(fileAssetKeyPattern, "assetKey 格式无效"),
  mimeType: z
    .string()
    .trim()
    .min(1, "mimeType 不能为空")
    .max(100, "mimeType 不能超过 100 个字符"),
  sizeBytes: z.coerce
    .number()
    .int("sizeBytes 必须为整数")
    .positive("sizeBytes 必须大于 0")
    .max(Number.MAX_SAFE_INTEGER, "sizeBytes 超出支持范围"),
  width: z.coerce
    .number()
    .int("width 必须为整数")
    .positive("width 必须大于 0")
    .max(20000, "width 超出支持范围")
    .optional(),
  height: z.coerce
    .number()
    .int("height 必须为整数")
    .positive("height 必须大于 0")
    .max(20000, "height 超出支持范围")
    .optional(),
});

export const fileDownloadQuerySchema = z.object({
  filename: z.string().trim().min(1, "filename 不能为空").max(255, "filename 不能超过 255 个字符").optional(),
});
