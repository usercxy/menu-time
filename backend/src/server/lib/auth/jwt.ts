import "server-only";

import { randomBytes } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";

import { getEnv } from "@/server/lib/env";
import { AppError, errorCodes } from "@/server/lib/errors";
import { parseDurationToMs, parseDurationToSeconds } from "@/server/lib/auth/duration";

type BaseTokenSubject = {
  userId: string;
  householdId: string;
  nickname: string;
  role: string;
};

export type AccessTokenClaims = BaseTokenSubject & {
  type: "access";
};

export type RefreshTokenClaims = BaseTokenSubject & {
  type: "refresh";
  tokenId: string;
};

const env = getEnv();
const accessSecret = new TextEncoder().encode(env.AUTH_ACCESS_TOKEN_SECRET);
const refreshSecret = new TextEncoder().encode(env.AUTH_REFRESH_TOKEN_SECRET);

function assertStringClaim(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`令牌缺少必要字段：${field}`, {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  return value;
}

export async function issueTokenPair(subject: BaseTokenSubject) {
  const refreshTokenId = randomBytes(24).toString("hex");
  const accessTokenExpiresIn = parseDurationToSeconds(env.AUTH_ACCESS_TOKEN_TTL);
  const refreshTokenExpiresIn = parseDurationToSeconds(env.AUTH_REFRESH_TOKEN_TTL);

  const accessToken = await new SignJWT({
    householdId: subject.householdId,
    nickname: subject.nickname,
    role: subject.role,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject.userId)
    .setIssuedAt()
    .setExpirationTime(env.AUTH_ACCESS_TOKEN_TTL)
    .sign(accessSecret);

  const refreshToken = await new SignJWT({
    householdId: subject.householdId,
    nickname: subject.nickname,
    role: subject.role,
    tokenId: refreshTokenId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject.userId)
    .setIssuedAt()
    .setExpirationTime(env.AUTH_REFRESH_TOKEN_TTL)
    .sign(refreshSecret);

  return {
    accessToken,
    refreshToken,
    refreshTokenId,
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
    refreshTokenExpiresAt: new Date(Date.now() + parseDurationToMs(env.AUTH_REFRESH_TOKEN_TTL)),
  };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  try {
    const { payload } = await jwtVerify(token, accessSecret);

    return {
      userId: assertStringClaim(payload.sub, "sub"),
      householdId: assertStringClaim(payload.householdId, "householdId"),
      nickname: assertStringClaim(payload.nickname, "nickname"),
      role: assertStringClaim(payload.role, "role"),
      type: assertStringClaim(payload.type, "type") as "access",
    };
  } catch (error) {
    throw new AppError("访问令牌无效或已过期", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
      cause: error,
    });
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);

    return {
      userId: assertStringClaim(payload.sub, "sub"),
      householdId: assertStringClaim(payload.householdId, "householdId"),
      nickname: assertStringClaim(payload.nickname, "nickname"),
      role: assertStringClaim(payload.role, "role"),
      tokenId: assertStringClaim(payload.tokenId, "tokenId"),
      type: assertStringClaim(payload.type, "type") as "refresh",
    };
  } catch (error) {
    throw new AppError("刷新令牌无效或已过期", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
      cause: error,
    });
  }
}
