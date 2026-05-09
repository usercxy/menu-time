import { createRouteHandler } from "@/server/lib/api/route-handler";
import { randomPickResultParamsSchema } from "@/server/modules/random/random.schema";
import * as randomService from "@/server/modules/random/random.service";

export const POST = createRouteHandler({
  schemas: {
    params: randomPickResultParamsSchema,
  },
  handler: async ({ session, params }) =>
    randomService.skipRandomPickResult({
      session,
      id: params.id,
      resultId: params.resultId,
    }),
});
