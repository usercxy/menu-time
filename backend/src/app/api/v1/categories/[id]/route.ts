import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  categoryUpdateBodySchema,
  taxonomyIdParamSchema,
} from "@/server/modules/taxonomy/taxonomy.schema";
import * as taxonomyService from "@/server/modules/taxonomy/taxonomy.service";

export const PATCH = createRouteHandler({
  schemas: {
    params: taxonomyIdParamSchema,
    body: categoryUpdateBodySchema,
  },
  handler: async ({ session, params, body }) =>
    taxonomyService.updateCategory({
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
    taxonomyService.deleteCategory({
      session,
      id: params.id,
    }),
});
