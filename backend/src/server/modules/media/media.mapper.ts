import type { MediaAssetRecord } from "@/server/modules/media/media.repository";
import type { MediaAssetDto } from "@/server/modules/media/media.types";

export function mapMediaAssetDto(record: MediaAssetRecord): MediaAssetDto {
  return {
    id: record.id,
    assetKey: record.assetKey,
    assetUrl: record.assetUrl,
    mimeType: record.mimeType,
    sizeBytes: Number(record.sizeBytes),
    width: record.width ?? null,
    height: record.height ?? null,
    purpose: record.purpose as MediaAssetDto["purpose"],
    createdAt: record.createdAt.toISOString(),
  };
}
