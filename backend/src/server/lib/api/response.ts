import { NextResponse } from "next/server";

import type { ErrorCode } from "@/server/lib/errors";

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type SuccessEnvelope<T> = {
  success: true;
  data: T;
  requestId: string;
};

type ErrorEnvelope = {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

export function successResponse<T>(
  data: T,
  requestId: string,
  init?: ResponseInit,
) {
  return NextResponse.json<SuccessEnvelope<T>>(
    {
      success: true,
      data,
      requestId,
    },
    init,
  );
}

export function errorResponse(
  input: ErrorEnvelope["error"],
  requestId: string,
  init?: ResponseInit,
) {
  return NextResponse.json<ErrorEnvelope>(
    {
      success: false,
      error: input,
      requestId,
    },
    init,
  );
}
