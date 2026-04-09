import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  recipeCompareQuerySchema,
  recipeIdParamSchema,
} from "@/server/modules/recipes/recipes.schema";
import * as recipesService from "@/server/modules/recipes/recipes.service";

export const GET = createRouteHandler({
  schemas: {
    params: recipeIdParamSchema,
    query: recipeCompareQuerySchema,
  },
  handler: async ({ session, params, query }) =>
    recipesService.compareRecipeVersions({
      session,
      recipeId: params.id,
      baseVersionNumber: query.base,
      targetVersionNumber: query.target,
    }),
});
