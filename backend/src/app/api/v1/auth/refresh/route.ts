import { createRouteHandler } from "@/server/lib/api/route-handler";
import { refreshSession } from "@/server/modules/auth/auth.service";
import { refreshTokenBodySchema } from "@/server/modules/auth/auth.schema";

export const POST = createRouteHandler({
  auth: "public",
  schemas: {
    body: refreshTokenBodySchema,
  },
  handler: async ({ body }) => refreshSession(body),
});
