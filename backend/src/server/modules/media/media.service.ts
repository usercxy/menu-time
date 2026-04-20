import type { AuthSession } from "@/server/lib/auth/session";
import { getPrismaClient } from "@/server/db/client";
import { AppError, errorCodes } from "@/server/lib/errors";
import { getEnv } from "@/server/lib/env";
import { getLogger } from "@/server/lib/logger";
import { requireRequestHouseholdId } from "@/server/lib/request/context";
import { getStorageAdapter } from "@/server/lib/storage/storage.adapter";
import { mapMediaAssetDto } from "@/server/modules/media/media.mapper";
import * as mediaRepository from "@/server/modules/media/media.repository";
import type {
  MediaAssetDto,
  MediaAssetRegistrationPayload,
  MediaUploadTokenPayload,
  MediaUploadTokenResultDto,
} from "@/server/modules/media/media.types";

const prisma = getPrismaClient();
const logger = getLogger({ module: "media" });

type SessionInput = {
  session?: Pick<AuthSession, "householdId" | "userId"> | null;
};

function resolveMediaHouseholdId(session?: Pick<AuthSession, "householdId"> | null) {
  return session?.householdId ?? requireRequestHouseholdId();
}

function resolveActingUserId(session?: Pick<AuthSession, "userId"> | null) {
  if (!session?.userId) {
    throw new AppError("未登录或登录已失效", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  return session.userId;
}

function assertSupportedCoverUpload(input: {
  contentType: string;
  sizeBytes: number;
}) {
  const env = getEnv();

  if (!env.MEDIA_ALLOWED_IMAGE_TYPES.includes(input.contentType)) {
    throw new AppError("图片格式暂不支持", {
      code: errorCodes.BUSINESS_RULE_VIOLATION,
      statusCode: 400,
      details: {
        allowedTypes: env.MEDIA_ALLOWED_IMAGE_TYPES,
      },
    });
  }

  if (input.sizeBytes > env.MEDIA_MAX_IMAGE_SIZE_BYTES) {
    throw new AppError("图片大小超过限制", {
      code: errorCodes.BUSINESS_RULE_VIOLATION,
      statusCode: 400,
      details: {
        maxSizeBytes: env.MEDIA_MAX_IMAGE_SIZE_BYTES,
      },
    });
  }
}

export async function createUploadToken(
  input: SessionInput & {
    data: MediaUploadTokenPayload;
  },
): Promise<MediaUploadTokenResultDto> {
  const householdId = resolveMediaHouseholdId(input.session);
  const env = getEnv();

  assertSupportedCoverUpload({
    contentType: input.data.contentType,
    sizeBytes: input.data.sizeBytes,
  });

  const result = await getStorageAdapter().createUploadToken({
    householdId,
    purpose: input.data.purpose,
    fileName: input.data.fileName,
    contentType: input.data.contentType,
    sizeBytes: input.data.sizeBytes,
  });

  logger.info(
    {
      householdId,
      purpose: input.data.purpose,
      assetKey: result.assetKey,
      sizeBytes: input.data.sizeBytes,
    },
    "media upload token created",
  );

  return {
    uploadUrl: result.uploadUrl,
    headers: result.headers,
    assetKey: result.assetKey,
    expiresInSeconds: result.expiresInSeconds ?? env.S3_SIGNED_URL_TTL_SECONDS,
    maxSizeBytes: env.MEDIA_MAX_IMAGE_SIZE_BYTES,
  };
}

export async function registerAsset(
  input: SessionInput & {
    data: MediaAssetRegistrationPayload;
  },
): Promise<MediaAssetDto> {
  const householdId = resolveMediaHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);

  assertSupportedCoverUpload({
    contentType: input.data.mimeType,
    sizeBytes: input.data.sizeBytes,
  });

  const existing = await mediaRepository.findMediaAssetByAssetKey(prisma, {
    assetKey: input.data.assetKey,
  });

  if (existing && existing.householdId !== householdId) {
    throw new AppError("资源归属不匹配", {
      code: errorCodes.FORBIDDEN,
      statusCode: 403,
    });
  }

  const verified = await getStorageAdapter().registerAsset({
    householdId,
    assetKey: input.data.assetKey,
    assetUrl: getStorageAdapter().getPublicUrl(input.data.assetKey),
    mimeType: input.data.mimeType,
    sizeBytes: input.data.sizeBytes,
    width: input.data.width,
    height: input.data.height,
    purpose: input.data.purpose,
    createdBy: createdById,
  });

  const saved = await mediaRepository.upsertMediaAsset(prisma, {
    householdId,
    assetKey: verified.assetKey,
    assetUrl: verified.assetUrl,
    mimeType: verified.mimeType,
    sizeBytes: verified.sizeBytes,
    width: verified.width,
    height: verified.height,
    purpose: input.data.purpose,
    createdById,
  });

  logger.info(
    {
      householdId,
      mediaAssetId: saved.id,
      assetKey: saved.assetKey,
    },
    "media asset registered",
  );

  return mapMediaAssetDto(saved);
}
