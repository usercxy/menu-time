import type { FileAssetRecord } from "@/server/modules/files/files.repository";
import type { FileAssetDto } from "@/server/modules/files/files.types";

export function mapFileAssetDto(record: FileAssetRecord): FileAssetDto {
  return {
    id: record.id,
    assetKey: record.assetKey,
    assetUrl: record.assetUrl,
    mimeType: record.mimeType,
    sizeBytes: Number(record.sizeBytes),
    width: record.width ?? null,
    height: record.height ?? null,
    purpose: record.purpose as FileAssetDto["purpose"],
    createdAt: record.createdAt.toISOString(),
  };
}
