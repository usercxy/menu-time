import { createRouteHandler } from "@/server/lib/api/route-handler";
import { getCurrentSession } from "@/server/modules/auth/auth.service";

export const GET = createRouteHandler({
  auth: "required",
  handler: async ({ session }) => getCurrentSession(session!.userId),
});
