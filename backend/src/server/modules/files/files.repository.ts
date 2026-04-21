import type { MediaAsset } from "@prisma/client";

import type { DbClient } from "@/server/db/transactions";
import type { FileUploadPurpose } from "@/server/modules/files/files.types";

export type FileAssetRecord = MediaAsset;

export async function findFileAssetById(
  db: DbClient,
  input: {
    householdId: string;
    id: string;
  },
) {
  return db.mediaAsset.findFirst({
    where: {
      id: input.id,
      householdId: input.householdId,
    },
  });
}

export async function findFileAssetByAssetKey(
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

export async function upsertFileAsset(
  db: DbClient,
  input: {
    householdId: string;
    assetKey: string;
    assetUrl: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
    purpose: FileUploadPurpose;
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
