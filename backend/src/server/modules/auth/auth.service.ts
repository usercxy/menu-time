import { getPrismaClient } from "@/server/db/client";
import { withTransaction } from "@/server/db/transactions";
import { issueTokenPair, verifyRefreshToken } from "@/server/lib/auth/jwt";
import { exchangeCodeForSession } from "@/server/lib/auth/wechat";
import { getEnv } from "@/server/lib/env";
import { AppError, errorCodes } from "@/server/lib/errors";
import { getLogger } from "@/server/lib/logger";
import { mapAuthResult, mapUserToSessionDto } from "@/server/modules/auth/auth.mapper";
import * as authRepository from "@/server/modules/auth/auth.repository";
import type { TokenPairDto } from "@/server/modules/auth/auth.types";

const prisma = getPrismaClient();
const logger = getLogger({ module: "auth" });

type PersistableUser = {
  id: string;
  householdId: string;
  nickname: string;
  role: string;
  status?: string;
  household: {
    id: string;
    name: string;
  };
};

function resolveNickname(inputNickname: string | undefined, openId: string) {
  return inputNickname?.trim() || `微信用户${openId.slice(-6)}`;
}

async function persistIssuedTokens(
  user: PersistableUser,
  revokeTokenId?: string,
): Promise<TokenPairDto> {
  const issued = await issueTokenPair({
    userId: user.id,
    householdId: user.householdId,
    nickname: user.nickname,
    role: user.role,
  });

  await withTransaction(async (tx) => {
    if (revokeTokenId) {
      await authRepository.revokeRefreshToken(tx, revokeTokenId);
    }

    await authRepository.createRefreshToken(tx, {
      tokenId: issued.refreshTokenId,
      userId: user.id,
      householdId: user.householdId,
      expiresAt: issued.refreshTokenExpiresAt,
    });
  });

  return {
    accessToken: issued.accessToken,
    refreshToken: issued.refreshToken,
    accessTokenExpiresIn: issued.accessTokenExpiresIn,
    refreshTokenExpiresIn: issued.refreshTokenExpiresIn,
  };
}

function assertActiveUser(user: PersistableUser | null | undefined) {
  if (!user || user.status === "disabled") {
    throw new AppError("用户不存在或已被禁用", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  return user;
}

export async function loginWithWechatCode(input: {
  code: string;
  nickname?: string;
}) {
  const env = getEnv();
  const wechatSession = await exchangeCodeForSession(input.code);
  const existingAccount = await authRepository.findWechatAccountByOpenId(
    prisma,
    wechatSession.openId,
  );

  let user: PersistableUser;

  if (existingAccount) {
    await authRepository.updateWechatAccountSession(
      prisma,
      existingAccount.id,
      wechatSession.sessionKey,
      wechatSession.unionId,
    );

    if (input.nickname?.trim() && existingAccount.user.nickname.startsWith("微信用户")) {
      user = assertActiveUser(
        await authRepository.updateUserNickname(
          prisma,
          existingAccount.user.id,
          input.nickname.trim(),
        ),
      );
    } else {
      user = assertActiveUser(existingAccount.user);
    }
  } else {
    user = await withTransaction(async (tx) => {
      let household = await authRepository.findBootstrapHousehold(tx);

      if (!household) {
        household = await authRepository.createHousehold(
          tx,
          env.MVP_DEFAULT_HOUSEHOLD_NAME,
        );
      }

      const existingUserCount = await authRepository.countUsersByHousehold(tx, household.id);
      const createdUser = await authRepository.createUser(tx, {
        householdId: household.id,
        nickname: resolveNickname(input.nickname, wechatSession.openId),
        role: existingUserCount === 0 ? "admin" : "member",
      });

      await authRepository.createWechatAccount(tx, {
        userId: createdUser.id,
        householdId: household.id,
        openId: wechatSession.openId,
        unionId: wechatSession.unionId,
        sessionKey: wechatSession.sessionKey,
      });

      return createdUser;
    });
  }

  const tokens = await persistIssuedTokens(user);

  logger.info(
    {
      userId: user.id,
      householdId: user.householdId,
    },
    "wechat login succeeded",
  );

  return mapAuthResult(user, tokens);
}

export async function refreshSession(input: { refreshToken: string }) {
  const verified = await verifyRefreshToken(input.refreshToken);
  const refreshTokenRecord = await authRepository.findRefreshTokenByTokenId(
    prisma,
    verified.tokenId,
  );

  if (!refreshTokenRecord || refreshTokenRecord.revokedAt || refreshTokenRecord.expiresAt <= new Date()) {
    throw new AppError("刷新令牌不可用", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  const user = assertActiveUser(refreshTokenRecord.user);
  const tokens = await persistIssuedTokens(user, verified.tokenId);

  logger.info(
    {
      userId: user.id,
      householdId: user.householdId,
    },
    "refresh token rotated",
  );

  return mapAuthResult(user, tokens);
}

export async function logout(input: { refreshToken: string }) {
  const verified = await verifyRefreshToken(input.refreshToken);
  await authRepository.revokeRefreshToken(prisma, verified.tokenId);

  logger.info(
    {
      userId: verified.userId,
      householdId: verified.householdId,
    },
    "refresh token revoked",
  );

  return {
    revoked: true,
  };
}

export async function getCurrentSession(userId: string) {
  const user = assertActiveUser(await authRepository.findUserById(prisma, userId));
  return mapUserToSessionDto(user);
}
