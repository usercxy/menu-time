import { createRouteHandler } from "@/server/lib/api/route-handler";
import { logout } from "@/server/modules/auth/auth.service";
import { logoutBodySchema } from "@/server/modules/auth/auth.schema";

export const POST = createRouteHandler({
  auth: "public",
  schemas: {
    body: logoutBodySchema,
  },
  handler: async ({ body }) => logout(body),
});
