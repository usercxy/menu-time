import "server-only";

import { randomUUID } from "node:crypto";

import {
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getEnv } from "@/server/lib/env";
import { AppError, errorCodes } from "@/server/lib/errors";
import type { StorageAdapter } from "@/server/lib/storage/storage.adapter";
import type {
  FilePurpose,
  ReadAssetUrlInput,
  ReadAssetUrlResult,
  RegisterAssetInput,
  UploadTokenInput,
  UploadTokenResult,
} from "@/server/lib/storage/storage.types";

type ResolvedS3Config = {
  bucket: string;
  endpoint: string;
  publicBaseUrl: string;
  region: string;
  accessKey: string;
  secretKey: string;
  signedUrlTtlSeconds: number;
  forcePathStyle: boolean;
};

const extensionByContentType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function encodeAssetKey(assetKey: string) {
  return assetKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function inferRegionFromEndpoint(endpoint: string) {
  const match = endpoint.match(/\b(ap-[a-z0-9-]+)\b/);
  return match?.[1] ?? "";
}

function isLocalEndpoint(endpoint: string) {
  try {
    const { hostname } = new URL(endpoint);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function resolveS3Config(): ResolvedS3Config {
  const env = getEnv();
  const explicitEndpoint = env.S3_ENDPOINT.trim();
  const explicitPublicBaseUrl = env.S3_PUBLIC_BASE_URL.trim();
  const fallbackCosEndpoint =
    env.CLOUD_VENDOR === "cos" && env.S3_REGION ? `https://cos.${env.S3_REGION}.myqcloud.com` : "";
  const fallbackCosPublicBaseUrl =
    env.CLOUD_VENDOR === "cos" && env.S3_REGION
      ? `https://${env.S3_BUCKET}.cos.${env.S3_REGION}.myqcloud.com`
      : "";
  const endpoint =
    env.CLOUD_VENDOR === "cos"
      ? explicitEndpoint && !isLocalEndpoint(explicitEndpoint)
        ? explicitEndpoint
        : fallbackCosEndpoint
      : explicitEndpoint;
  const region = env.S3_REGION || inferRegionFromEndpoint(endpoint);

  if (!region) {
    throw new Error("S3_REGION 未配置，且无法从 S3_ENDPOINT 推断地域");
  }

  const resolvedEndpoint =
    endpoint || (env.CLOUD_VENDOR === "cos" ? `https://cos.${region}.myqcloud.com` : "");

  const publicBaseUrl =
    env.CLOUD_VENDOR === "cos"
      ? explicitPublicBaseUrl && !isLocalEndpoint(explicitPublicBaseUrl)
        ? explicitPublicBaseUrl
        : fallbackCosPublicBaseUrl || `https://${env.S3_BUCKET}.cos.${region}.myqcloud.com`
      : explicitPublicBaseUrl;

  if (!resolvedEndpoint || !publicBaseUrl) {
    throw new Error("对象存储缺少 endpoint 或 public base url 配置");
  }

  return {
    bucket: env.S3_BUCKET,
    endpoint: resolvedEndpoint,
    publicBaseUrl,
    region,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    signedUrlTtlSeconds: env.S3_SIGNED_URL_TTL_SECONDS,
    forcePathStyle: env.CLOUD_VENDOR === "cos" ? false : isLocalEndpoint(resolvedEndpoint),
  };
}

function resolveAssetPrefix(householdId: string, purpose: FilePurpose) {
  if (purpose === "image") {
    return `households/${householdId}/files/images`;
  }

  return `households/${householdId}/files`;
}

function resolveFileExtension(fileName: string, contentType: string) {
  const extensionFromType = extensionByContentType[contentType.toLowerCase()];

  if (extensionFromType) {
    return extensionFromType;
  }

  const fileExtension = /\.[a-zA-Z0-9]+$/.exec(fileName)?.[0]?.toLowerCase();
  return fileExtension || "";
}

function buildAssetKey(input: UploadTokenInput) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const extension = resolveFileExtension(input.fileName, input.contentType);

  return `${resolveAssetPrefix(input.householdId, "image")}/${year}/${month}/${randomUUID()}${extension}`;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\r\n]/g, "").trim();
}

export class S3StorageAdapter implements StorageAdapter {
  private readonly config = resolveS3Config();

  private readonly client = new S3Client({
    region: this.config.region,
    endpoint: this.config.endpoint,
    forcePathStyle: this.config.forcePathStyle,
    credentials: {
      accessKeyId: this.config.accessKey,
      secretAccessKey: this.config.secretKey,
    },
  });

  async createUploadToken(input: UploadTokenInput): Promise<UploadTokenResult> {
    const assetKey = buildAssetKey(input);

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: assetKey,
      ContentType: input.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.config.signedUrlTtlSeconds,
    });

    return {
      uploadUrl,
      headers: {
        "Content-Type": input.contentType,
      },
      assetKey,
      expiresInSeconds: this.config.signedUrlTtlSeconds,
    };
  }

  async createReadAssetUrl(input: ReadAssetUrlInput): Promise<ReadAssetUrlResult> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: input.assetKey,
      ResponseContentType: input.mimeType,
      ResponseContentDisposition:
        input.disposition === "attachment"
          ? `attachment${input.fileName ? `; filename*=UTF-8''${encodeURIComponent(sanitizeFileName(input.fileName))}` : ""}`
          : "inline",
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: this.config.signedUrlTtlSeconds,
    });

    return {
      url,
      expiresInSeconds: this.config.signedUrlTtlSeconds,
    };
  }

  async registerAsset(input: RegisterAssetInput) {
    const expectedPrefix = `${resolveAssetPrefix(input.householdId, input.purpose)}/`;

    if (!input.assetKey.startsWith(expectedPrefix)) {
      throw new AppError("资源路径不合法", {
        code: errorCodes.BUSINESS_RULE_VIOLATION,
        statusCode: 400,
      });
    }

    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: input.assetKey,
        }),
      );

      const actualSizeBytes = response.ContentLength;
      const actualMimeType = response.ContentType;

      if (typeof actualSizeBytes !== "number" || actualSizeBytes <= 0) {
        throw new AppError("上传文件大小无效", {
          code: errorCodes.BUSINESS_RULE_VIOLATION,
          statusCode: 400,
        });
      }

      if (!actualMimeType) {
        throw new AppError("上传文件类型无效", {
          code: errorCodes.BUSINESS_RULE_VIOLATION,
          statusCode: 400,
        });
      }

      if (actualSizeBytes !== input.sizeBytes) {
        throw new AppError("上传文件大小与登记信息不一致", {
          code: errorCodes.BUSINESS_RULE_VIOLATION,
          statusCode: 400,
        });
      }

      if (actualMimeType !== input.mimeType) {
        throw new AppError("上传文件类型与登记信息不一致", {
          code: errorCodes.BUSINESS_RULE_VIOLATION,
          statusCode: 400,
        });
      }

      return {
        ...input,
        assetUrl: this.getPublicUrl(input.assetKey),
        mimeType: actualMimeType,
        sizeBytes: actualSizeBytes,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
        throw new AppError("资源文件不存在或尚未上传完成", {
          code: errorCodes.NOT_FOUND,
          statusCode: 404,
          cause: error,
        });
      }

      throw new AppError("对象存储校验失败", {
        code: errorCodes.INTERNAL_ERROR,
        statusCode: 500,
        cause: error,
      });
    }
  }

  getPublicUrl(assetKey: string): string {
    return new URL(encodeAssetKey(assetKey), normalizeBaseUrl(this.config.publicBaseUrl)).toString();
  }
}

export function createS3StorageAdapter() {
  return new S3StorageAdapter();
}
