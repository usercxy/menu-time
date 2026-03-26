import { z } from "zod";

export const wechatLoginBodySchema = z.object({
  code: z.string().trim().min(1, "code 不能为空"),
  nickname: z.string().trim().min(1).max(50).optional(),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().trim().min(1, "refreshToken 不能为空"),
});

export const logoutBodySchema = refreshTokenBodySchema;
