import type { DbClient } from "@/server/db/transactions";

export async function findWechatAccountByOpenId(db: DbClient, openId: string) {
  return db.wechatAccount.findUnique({
    where: { openId },
    include: {
      user: {
        include: {
          household: true,
        },
      },
    },
  });
}

export async function findUserById(db: DbClient, userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      household: true,
    },
  });
}

export async function findBootstrapHousehold(db: DbClient) {
  return db.household.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function countUsersByHousehold(db: DbClient, householdId: string) {
  return db.user.count({
    where: {
      householdId,
    },
  });
}

export async function createHousehold(db: DbClient, name: string) {
  return db.household.create({
    data: {
      name,
      status: "active",
    },
  });
}

export async function createUser(
  db: DbClient,
  data: {
    householdId: string;
    nickname: string;
    role: string;
  },
) {
  return db.user.create({
    data: {
      householdId: data.householdId,
      nickname: data.nickname,
      role: data.role,
      status: "active",
    },
    include: {
      household: true,
    },
  });
}

export async function updateUserNickname(
  db: DbClient,
  userId: string,
  nickname: string,
) {
  return db.user.update({
    where: { id: userId },
    data: {
      nickname,
    },
    include: {
      household: true,
    },
  });
}

export async function createWechatAccount(
  db: DbClient,
  data: {
    userId: string;
    householdId: string;
    openId: string;
    unionId: string | null;
    sessionKey: string;
  },
) {
  return db.wechatAccount.create({
    data: {
      userId: data.userId,
      householdId: data.householdId,
      openId: data.openId,
      unionId: data.unionId,
      sessionKey: data.sessionKey,
    },
  });
}

export async function updateWechatAccountSession(
  db: DbClient,
  wechatAccountId: string,
  sessionKey: string,
  unionId: string | null,
) {
  return db.wechatAccount.update({
    where: {
      id: wechatAccountId,
    },
    data: {
      sessionKey,
      unionId,
    },
  });
}

export async function createRefreshToken(
  db: DbClient,
  data: {
    tokenId: string;
    userId: string;
    householdId: string;
    expiresAt: Date;
  },
) {
  return db.refreshToken.create({
    data,
  });
}

export async function findRefreshTokenByTokenId(db: DbClient, tokenId: string) {
  return db.refreshToken.findUnique({
    where: { tokenId },
    include: {
      user: {
        include: {
          household: true,
        },
      },
    },
  });
}

export async function revokeRefreshToken(db: DbClient, tokenId: string) {
  return db.refreshToken.updateMany({
    where: {
      tokenId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
