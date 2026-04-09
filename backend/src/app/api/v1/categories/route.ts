import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  categoryCreateBodySchema,
  taxonomyListQuerySchema,
} from "@/server/modules/taxonomy/taxonomy.schema";
import * as taxonomyService from "@/server/modules/taxonomy/taxonomy.service";

export const GET = createRouteHandler({
  schemas: {
    query: taxonomyListQuerySchema,
  },
  handler: async ({ session, query }) =>
    taxonomyService.listCategories({
      session,
      includeArchived: query.includeArchived,
    }),
});

export const POST = createRouteHandler({
  schemas: {
    body: categoryCreateBodySchema,
  },
  handler: async ({ session, body }) =>
    taxonomyService.createCategory({
      session,
      data: body,
    }),
});
