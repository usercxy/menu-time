import { createRouteHandler } from "@/server/lib/api/route-handler";
import { recipeVersionParamsSchema } from "@/server/modules/recipes/recipes.schema";
import * as recipesService from "@/server/modules/recipes/recipes.service";

export const GET = createRouteHandler({
  schemas: {
    params: recipeVersionParamsSchema,
  },
  handler: async ({ session, params }) =>
    recipesService.getRecipeVersionDetail({
      session,
      recipeId: params.id,
      versionId: params.versionId,
    }),
});
