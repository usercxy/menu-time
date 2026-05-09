import { createRouteHandler } from "@/server/lib/api/route-handler";
import { randomPickSessionCreateBodySchema } from "@/server/modules/random/random.schema";
import * as randomService from "@/server/modules/random/random.service";

export const POST = createRouteHandler({
  schemas: {
    body: randomPickSessionCreateBodySchema,
  },
  successStatus: 201,
  handler: async ({ session, body }) =>
    randomService.createRandomPickSession({
      session,
      data: body,
    }),
});
