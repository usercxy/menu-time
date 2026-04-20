import { z } from "zod";

const assetKeyPattern = /^households\/[0-9a-f-]+\/recipes\/covers\/\d{4}\/\d{2}\/[0-9a-f-]+\.(jpg|png|webp)$/i;

export const mediaUploadPurposeSchema = z.literal("cover");

export const mediaUploadTokenBodySchema = z.object({
  purpose: mediaUploadPurposeSchema,
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

export const mediaAssetRegisterBodySchema = z.object({
  assetKey: z
    .string()
    .trim()
    .min(1, "assetKey 不能为空")
    .max(255, "assetKey 不能超过 255 个字符")
    .regex(assetKeyPattern, "assetKey 格式无效"),
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
  purpose: mediaUploadPurposeSchema,
});
