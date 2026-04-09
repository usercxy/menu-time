import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

import { AppError, errorCodes } from "@/server/lib/errors";

export type RequestContext = {
  requestId: string;
  userId?: string;
  householdId?: string;
  role?: string;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
  context: RequestContext,
  callback: () => Promise<T> | T,
) {
  return requestContextStorage.run(context, callback);
}

export function getRequestContext() {
  return requestContextStorage.getStore();
}

export function assignRequestContext(partial: Partial<RequestContext>) {
  const current = requestContextStorage.getStore();

  if (!current) {
    return;
  }

  Object.assign(current, partial);
}

export function requireRequestHouseholdId() {
  const householdId = getRequestContext()?.householdId;

  if (!householdId) {
    throw new AppError("缺少家庭上下文", {
      code: errorCodes.UNAUTHORIZED,
      statusCode: 401,
    });
  }

  return householdId;
}
