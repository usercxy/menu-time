import type { NextRequest } from "next/server";

import { verifyAccessToken } from "@/server/lib/auth/jwt";
import { AppError, errorCodes } from "@/server/lib/errors";

export type AuthSession = Awaited<ReturnType<typeof verifyAccessToken>>;

export async function getSessionFromRequest(
  request: NextRequest,
  allowMissing: boolean,
) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return allowMissing ? null : null;
  }

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    throw new AppError("Authorization 头格式无效", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    throw new AppError("缺少访问令牌", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  return verifyAccessToken(token);
}

export function getHouseholdId(session: AuthSession) {
  return session.householdId;
}
