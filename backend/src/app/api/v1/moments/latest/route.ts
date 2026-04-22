import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  latestMomentsQuerySchema,
} from "@/server/modules/moments/moments.schema";
import * as momentsService from "@/server/modules/moments/moments.service";

export const GET = createRouteHandler({
  schemas: {
    query: latestMomentsQuerySchema,
  },
  handler: async ({ session, query }) =>
    momentsService.listLatestMoments({
      session,
      limit: query.limit,
    }),
});
