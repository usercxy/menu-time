import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  tagUpdateBodySchema,
  taxonomyIdParamSchema,
} from "@/server/modules/taxonomy/taxonomy.schema";
import * as taxonomyService from "@/server/modules/taxonomy/taxonomy.service";

export const PATCH = createRouteHandler({
  schemas: {
    params: taxonomyIdParamSchema,
    body: tagUpdateBodySchema,
  },
  handler: async ({ session, params, body }) =>
    taxonomyService.updateTag({
      session,
      id: params.id,
      data: body,
    }),
});

export const DELETE = createRouteHandler({
  schemas: {
    params: taxonomyIdParamSchema,
  },
  handler: async ({ session, params }) =>
    taxonomyService.deleteTag({
      session,
      id: params.id,
    }),
});
