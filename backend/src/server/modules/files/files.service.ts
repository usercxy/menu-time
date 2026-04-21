import type { AuthSession } from "@/server/lib/auth/session";
import { getPrismaClient } from "@/server/db/client";
import { AppError, errorCodes } from "@/server/lib/errors";
import { getEnv } from "@/server/lib/env";
import { getLogger } from "@/server/lib/logger";
import { requireRequestHouseholdId } from "@/server/lib/request/context";
import { getStorageAdapter } from "@/server/lib/storage/storage.adapter";
import { mapFileAssetDto } from "@/server/modules/files/files.mapper";
import * as filesRepository from "@/server/modules/files/files.repository";
import type {
  FileAssetDto,
  FileAssetRegistrationPayload,
  FileReadPayload,
  FileReadUrlDto,
  FileUploadTokenPayload,
  FileUploadTokenResultDto,
} from "@/server/modules/files/files.types";

const prisma = getPrismaClient();
const logger = getLogger({ module: "files" });

type SessionInput = {
  session?: Pick<AuthSession, "householdId" | "userId"> | null;
};

function resolveFilesHouseholdId(session?: Pick<AuthSession, "householdId"> | null) {
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

function assertSupportedImage(input: { contentType: string; sizeBytes: number }) {
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
    data: FileUploadTokenPayload;
  },
): Promise<FileUploadTokenResultDto> {
  const householdId = resolveFilesHouseholdId(input.session);
  const env = getEnv();

  assertSupportedImage({
    contentType: input.data.contentType,
    sizeBytes: input.data.sizeBytes,
  });

  const result = await getStorageAdapter().createUploadToken({
    householdId,
    fileName: input.data.fileName,
    contentType: input.data.contentType,
    sizeBytes: input.data.sizeBytes,
  });

  logger.info(
    {
      householdId,
      assetKey: result.assetKey,
      sizeBytes: input.data.sizeBytes,
    },
    "file upload token created",
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
    data: FileAssetRegistrationPayload;
  },
): Promise<FileAssetDto> {
  const householdId = resolveFilesHouseholdId(input.session);
  const createdById = resolveActingUserId(input.session);

  assertSupportedImage({
    contentType: input.data.mimeType,
    sizeBytes: input.data.sizeBytes,
  });

  const existing = await filesRepository.findFileAssetByAssetKey(prisma, {
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
    purpose: "image",
    createdBy: createdById,
  });

  const saved = await filesRepository.upsertFileAsset(prisma, {
    householdId,
    assetKey: verified.assetKey,
    assetUrl: verified.assetUrl,
    mimeType: verified.mimeType,
    sizeBytes: verified.sizeBytes,
    width: verified.width,
    height: verified.height,
    purpose: "image",
    createdById,
  });

  logger.info(
    {
      householdId,
      fileAssetId: saved.id,
      assetKey: saved.assetKey,
    },
    "file asset registered",
  );

  return mapFileAssetDto(saved);
}

async function findOwnedFileOrThrow(input: SessionInput & { id: string }) {
  const householdId = resolveFilesHouseholdId(input.session);
  const file = await filesRepository.findFileAssetById(prisma, {
    householdId,
    id: input.id,
  });

  if (!file) {
    throw new AppError("文件不存在", {
      code: errorCodes.NOT_FOUND,
      statusCode: 404,
    });
  }

  return file;
}

export async function createPreviewUrl(
  input: SessionInput & {
    data: FileReadPayload;
  },
): Promise<FileReadUrlDto> {
  const file = await findOwnedFileOrThrow({
    session: input.session,
    id: input.data.id,
  });

  return getStorageAdapter().createReadAssetUrl({
    assetKey: file.assetKey,
    mimeType: file.mimeType,
    disposition: "inline",
  });
}

export async function createDownloadUrl(
  input: SessionInput & {
    data: FileReadPayload;
  },
): Promise<FileReadUrlDto> {
  const file = await findOwnedFileOrThrow({
    session: input.session,
    id: input.data.id,
  });

  return getStorageAdapter().createReadAssetUrl({
    assetKey: file.assetKey,
    mimeType: file.mimeType,
    disposition: "attachment",
    fileName: input.data.fileName,
  });
}
