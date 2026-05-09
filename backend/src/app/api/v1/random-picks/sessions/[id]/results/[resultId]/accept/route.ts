import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  randomPickResultAcceptBodySchema,
  randomPickResultParamsSchema,
} from "@/server/modules/random/random.schema";
import * as randomService from "@/server/modules/random/random.service";

export const POST = createRouteHandler({
  schemas: {
    params: randomPickResultParamsSchema,
    body: randomPickResultAcceptBodySchema,
  },
  handler: async ({ session, params, body }) =>
    randomService.acceptRandomPickResult({
      session,
      id: params.id,
      resultId: params.resultId,
      data: body,
    }),
});
