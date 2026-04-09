import { createRouteHandler } from "@/server/lib/api/route-handler";
import { taxonomyReorderBodySchema } from "@/server/modules/taxonomy/taxonomy.schema";
import * as taxonomyService from "@/server/modules/taxonomy/taxonomy.service";

export const POST = createRouteHandler({
  schemas: {
    body: taxonomyReorderBodySchema,
  },
  handler: async ({ session, body }) =>
    taxonomyService.reorderCategories({
      session,
      items: body.items,
    }),
});
