import { ZodError, type z } from "zod";
import { type NextRequest, NextResponse } from "next/server";

import { successResponse, errorResponse } from "@/server/lib/api/response";
import { getSessionFromRequest, type AuthSession } from "@/server/lib/auth/session";
import { getLogger } from "@/server/lib/logger";
import {
  assignRequestContext,
  runWithRequestContext,
} from "@/server/lib/request/context";
import {
  getRequestIdHeaderName,
  resolveRequestId,
} from "@/server/lib/request/request-id";
import { AppError, errorCodes } from "@/server/lib/errors";

type AuthMode = "public" | "optional" | "required";

type HandlerSchemas = {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
};

type InferSchema<T extends z.ZodTypeAny | undefined, Fallback> = T extends z.ZodTypeAny
  ? z.infer<T>
  : Fallback;

type RouteHandlerContext<Schemas extends HandlerSchemas> = {
  request: NextRequest;
  requestId: string;
  session: AuthSession | null;
  body: InferSchema<Schemas["body"], undefined>;
  query: InferSchema<Schemas["query"], undefined>;
  params: InferSchema<Schemas["params"], Record<string, string>>;
};

type CreateRouteHandlerOptions<Schemas extends HandlerSchemas> = {
  auth?: AuthMode;
  schemas?: Schemas;
  successStatus?: number;
  handler: (context: RouteHandlerContext<Schemas>) => Promise<unknown>;
};

function isObjectWithCode(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

function toAppError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError("请求参数校验失败", {
      code: errorCodes.VALIDATION_ERROR,
      statusCode: 400,
      details: error.flatten(),
      cause: error,
    });
  }

  if (isObjectWithCode(error) && error.code === "P2002") {
    return new AppError("数据冲突，请稍后重试", {
      code: errorCodes.CONFLICT,
      statusCode: 409,
      cause: error,
    });
  }

  return new AppError("服务器内部错误", {
    code: errorCodes.INTERNAL_ERROR,
    statusCode: 500,
    cause: error,
  });
}

async function parseBody(request: NextRequest, schema?: z.ZodTypeAny) {
  if (!schema) {
    return undefined;
  }

  const json = await request.json().catch(() => {
    throw new AppError("请求体不是合法 JSON", {
      code: errorCodes.VALIDATION_ERROR,
      statusCode: 400,
    });
  });

  return schema.parse(json);
}

function parseQuery(request: NextRequest, schema?: z.ZodTypeAny) {
  if (!schema) {
    return undefined;
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  return schema.parse(query);
}

async function parseParams(
  context: { params?: Promise<Record<string, string>> | Record<string, string> } | undefined,
  schema?: z.ZodTypeAny,
) {
  const params = (await context?.params) ?? {};

  if (!schema) {
    return params;
  }

  return schema.parse(params);
}

export function createRouteHandler<Schemas extends HandlerSchemas = HandlerSchemas>(
  options: CreateRouteHandlerOptions<Schemas>,
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> | Record<string, string> },
  ) => {
    const requestId = resolveRequestId(request.headers.get(getRequestIdHeaderName()));
    const startedAt = Date.now();

    return runWithRequestContext({ requestId }, async () => {
      const logger = getLogger({ scope: "route" });

      try {
        const authMode = options.auth ?? "required";
        const session = await getSessionFromRequest(request, authMode !== "public");

        if (authMode === "required" && !session) {
          throw new AppError("未登录或登录已失效", {
            code: errorCodes.UNAUTHORIZED,
            statusCode: 401,
          });
        }

        if (session) {
          assignRequestContext({
            userId: session.userId,
            householdId: session.householdId,
            role: session.role,
          });
        }

        const body = await parseBody(request, options.schemas?.body);
        const query = parseQuery(request, options.schemas?.query);
        const params = await parseParams(context, options.schemas?.params);

        const data = await options.handler({
          request,
          requestId,
          session,
          body: body as InferSchema<Schemas["body"], undefined>,
          query: query as InferSchema<Schemas["query"], undefined>,
          params: params as InferSchema<Schemas["params"], Record<string, string>>,
        });

        logger.info(
          {
            method: request.method,
            path: request.nextUrl.pathname,
            durationMs: Date.now() - startedAt,
          },
          "request completed",
        );

        const response = successResponse(data, requestId, {
          status: options.successStatus ?? 200,
        });
        response.headers.set(getRequestIdHeaderName(), requestId);
        return response;
      } catch (error) {
        const appError = toAppError(error);

        logger.error(
          {
            err: error,
            code: appError.code,
            statusCode: appError.statusCode,
            method: request.method,
            path: request.nextUrl.pathname,
            durationMs: Date.now() - startedAt,
          },
          "request failed",
        );

        const response = errorResponse(
          {
            code: appError.code,
            message: appError.message,
            details: appError.details ?? undefined,
          },
          requestId,
          { status: appError.statusCode },
        );
        response.headers.set(getRequestIdHeaderName(), requestId);
        return response;
      }
    });
  };
}

export function noContentResponse(requestId: string) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set(getRequestIdHeaderName(), requestId);
  return response;
}
