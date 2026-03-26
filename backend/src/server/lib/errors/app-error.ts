import { errorCodes, type ErrorCode } from "@/server/lib/errors/error-codes";

type AppErrorOptions = {
  code?: ErrorCode;
  statusCode?: number;
  details?: unknown;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? errorCodes.INTERNAL_ERROR;
    this.statusCode = options.statusCode ?? 500;
    this.details = options.details ?? null;
    this.cause = options.cause;
  }
}
