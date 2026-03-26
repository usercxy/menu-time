import { randomUUID } from "node:crypto";

import { getEnv } from "@/server/lib/env";

export function resolveRequestId(headerValue: string | null | undefined) {
  if (headerValue && headerValue.trim().length > 0) {
    return headerValue.trim();
  }

  return randomUUID();
}

export function getRequestIdHeaderName() {
  return getEnv().REQUEST_ID_HEADER;
}
