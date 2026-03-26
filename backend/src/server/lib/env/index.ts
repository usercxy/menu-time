import "server-only";

import { z } from "zod";

const durationPattern = /^\d+(ms|s|m|h|d)$/;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().trim().min(1).default("menu-time-backend"),
  APP_BASE_URL: z.url(),
  API_PREFIX: z.string().trim().startsWith("/").default("/api/v1"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  REQUEST_ID_HEADER: z.string().trim().min(1).default("x-request-id"),
  DATABASE_URL: z.string().trim().min(1),
  AUTH_ACCESS_TOKEN_SECRET: z.string().trim().min(16),
  AUTH_REFRESH_TOKEN_SECRET: z.string().trim().min(16),
  AUTH_ACCESS_TOKEN_TTL: z.string().regex(durationPattern),
  AUTH_REFRESH_TOKEN_TTL: z.string().regex(durationPattern),
  WECHAT_APP_ID: z.string().trim().min(1),
  WECHAT_APP_SECRET: z.string().trim().min(1),
  WECHAT_API_BASE_URL: z.url(),
  MVP_DEFAULT_HOUSEHOLD_NAME: z.string().trim().min(1).default("我的家庭"),
  S3_ENDPOINT: z.string().trim().min(1),
  S3_BUCKET: z.string().trim().min(1),
  S3_ACCESS_KEY: z.string().trim().min(1),
  S3_SECRET_KEY: z.string().trim().min(1),
  S3_PUBLIC_BASE_URL: z.string().trim().min(1),
  PG_BOSS_SCHEMA: z.string().trim().min(1).default("pgboss"),
  ENABLE_JOB_WORKER: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SENTRY_DSN: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function isProduction() {
  return getEnv().NODE_ENV === "production";
}
