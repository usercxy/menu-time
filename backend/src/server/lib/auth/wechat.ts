import "server-only";

import { getEnv, isProduction } from "@/server/lib/env";
import { AppError, errorCodes } from "@/server/lib/errors";

type WechatCode2SessionResponse = {
  openid?: string;
  unionid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
};

export type WechatSession = {
  openId: string;
  unionId: string | null;
  sessionKey: string;
};

export async function exchangeCodeForSession(code: string): Promise<WechatSession> {
  const env = getEnv();

  if (!isProduction() && code.startsWith("mock:")) {
    const mockOpenId = code.replace("mock:", "").trim() || "mock-openid";

    return {
      openId: mockOpenId,
      unionId: null,
      sessionKey: `mock-session-key-${mockOpenId}`,
    };
  }

  const url = new URL("/sns/jscode2session", env.WECHAT_API_BASE_URL);
  url.searchParams.set("appid", env.WECHAT_APP_ID);
  url.searchParams.set("secret", env.WECHAT_APP_SECRET);
  url.searchParams.set("js_code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AppError("微信登录服务请求失败", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
      details: { status: response.status },
    });
  }

  const payload = (await response.json()) as WechatCode2SessionResponse;

  if (payload.errcode) {
    throw new AppError(payload.errmsg ?? "微信登录失败", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
      details: {
        errcode: payload.errcode,
      },
    });
  }

  if (!payload.openid || !payload.session_key) {
    throw new AppError("微信登录返回数据不完整", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  return {
    openId: payload.openid,
    unionId: payload.unionid ?? null,
    sessionKey: payload.session_key,
  };
}
