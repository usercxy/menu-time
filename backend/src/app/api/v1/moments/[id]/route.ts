import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  momentIdParamsSchema,
  momentUpdateBodySchema,
} from "@/server/modules/moments/moments.schema";
import * as momentsService from "@/server/modules/moments/moments.service";

export const PATCH = createRouteHandler({
  schemas: {
    params: momentIdParamsSchema,
    body: momentUpdateBodySchema,
  },
  handler: async ({ session, params, body }) =>
    momentsService.updateMoment({
      session,
      id: params.id,
      data: body,
    }),
});

export const DELETE = createRouteHandler({
  schemas: {
    params: momentIdParamsSchema,
  },
  handler: async ({ session, params }) =>
    momentsService.deleteMoment({
      session,
      id: params.id,
    }),
});
