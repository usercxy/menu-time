import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  tagCreateBodySchema,
  taxonomyListQuerySchema,
} from "@/server/modules/taxonomy/taxonomy.schema";
import * as taxonomyService from "@/server/modules/taxonomy/taxonomy.service";

export const GET = createRouteHandler({
  schemas: {
    query: taxonomyListQuerySchema,
  },
  handler: async ({ session, query }) =>
    taxonomyService.listTags({
      session,
      includeArchived: query.includeArchived,
    }),
});

export const POST = createRouteHandler({
  schemas: {
    body: tagCreateBodySchema,
  },
  handler: async ({ session, body }) =>
    taxonomyService.createTag({
      session,
      data: body,
    }),
});
