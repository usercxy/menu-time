import { createRouteHandler } from "@/server/lib/api/route-handler";
import { randomPickSessionParamsSchema } from "@/server/modules/random/random.schema";
import * as randomService from "@/server/modules/random/random.service";

export const POST = createRouteHandler({
  schemas: {
    params: randomPickSessionParamsSchema,
  },
  handler: async ({ session, params }) =>
    randomService.redrawRandomPickSession({
      session,
      id: params.id,
    }),
});
