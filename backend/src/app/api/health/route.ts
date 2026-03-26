import { getPrismaClient } from "@/server/db/client";
import { createRouteHandler } from "@/server/lib/api/route-handler";
import { getEnv } from "@/server/lib/env";
import { AppError, errorCodes } from "@/server/lib/errors";

export const GET = createRouteHandler({
  auth: "public",
  handler: async () => {
    const prisma = getPrismaClient();

    try {
      await prisma.$queryRawUnsafe("SELECT 1");
    } catch (error) {
      throw new AppError("数据库健康检查失败", {
        code: errorCodes.INTERNAL_ERROR,
        statusCode: 503,
        cause: error,
      });
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        api: "ok",
        database: "ok",
        jobs: getEnv().ENABLE_JOB_WORKER ? "configured" : "disabled",
      },
    };
  },
});
