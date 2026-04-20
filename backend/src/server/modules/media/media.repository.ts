import type { MediaAsset } from "@prisma/client";

import type { DbClient } from "@/server/db/transactions";
import type { MediaUploadPurpose } from "@/server/modules/media/media.types";

export type MediaAssetRecord = MediaAsset;

export async function findMediaAssetByAssetKey(
  db: DbClient,
  input: {
    assetKey: string;
  },
) {
  return db.mediaAsset.findUnique({
    where: {
      assetKey: input.assetKey,
    },
  });
}

export async function upsertMediaAsset(
  db: DbClient,
  input: {
    householdId: string;
    assetKey: string;
    assetUrl: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
    purpose: MediaUploadPurpose;
    createdById: string;
  },
) {
  return db.mediaAsset.upsert({
    where: {
      assetKey: input.assetKey,
    },
    create: {
      householdId: input.householdId,
      assetKey: input.assetKey,
      assetUrl: input.assetUrl,
      mimeType: input.mimeType,
      sizeBytes: BigInt(input.sizeBytes),
      width: input.width,
      height: input.height,
      purpose: input.purpose,
      createdById: input.createdById,
    },
    update: {
      assetUrl: input.assetUrl,
      mimeType: input.mimeType,
      sizeBytes: BigInt(input.sizeBytes),
      width: input.width,
      height: input.height,
      purpose: input.purpose,
    },
  });
}
