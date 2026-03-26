import { createRouteHandler } from "@/server/lib/api/route-handler";
import { loginWithWechatCode } from "@/server/modules/auth/auth.service";
import { wechatLoginBodySchema } from "@/server/modules/auth/auth.schema";

export const POST = createRouteHandler({
  auth: "public",
  schemas: {
    body: wechatLoginBodySchema,
  },
  handler: async ({ body }) => loginWithWechatCode(body),
});
