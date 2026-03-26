import "server-only";

import pino, { type Logger, type LoggerOptions } from "pino";

import { getEnv } from "@/server/lib/env";
import { getRequestContext } from "@/server/lib/request/context";

const env = getEnv();

const loggerOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: {
    appName: env.APP_NAME,
  },
};

const rootLogger = pino(loggerOptions);

export function getLogger(bindings: Record<string, unknown> = {}): Logger {
  const context = getRequestContext();

  return rootLogger.child({
    requestId: context?.requestId,
    userId: context?.userId,
    householdId: context?.householdId,
    role: context?.role,
    ...bindings,
  });
}
