import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  momentCreateBodySchema,
  momentListQuerySchema,
  recipeMomentParamsSchema,
} from "@/server/modules/moments/moments.schema";
import * as momentsService from "@/server/modules/moments/moments.service";

export const GET = createRouteHandler({
  schemas: {
    params: recipeMomentParamsSchema,
    query: momentListQuerySchema,
  },
  handler: async ({ session, params, query }) =>
    momentsService.listRecipeMoments({
      session,
      recipeId: params.id,
      page: query.page,
      pageSize: query.pageSize,
    }),
});

export const POST = createRouteHandler({
  schemas: {
    params: recipeMomentParamsSchema,
    body: momentCreateBodySchema,
  },
  successStatus: 201,
  handler: async ({ session, params, body }) =>
    momentsService.createMoment({
      session,
      recipeId: params.id,
      data: body,
    }),
});
