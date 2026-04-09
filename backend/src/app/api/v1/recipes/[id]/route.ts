import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  recipeIdParamSchema,
  recipeUpdateBodySchema,
} from "@/server/modules/recipes/recipes.schema";
import * as recipesService from "@/server/modules/recipes/recipes.service";

export const GET = createRouteHandler({
  schemas: {
    params: recipeIdParamSchema,
  },
  handler: async ({ session, params }) =>
    recipesService.getRecipeDetail({
      session,
      id: params.id,
    }),
});

export const PATCH = createRouteHandler({
  schemas: {
    params: recipeIdParamSchema,
    body: recipeUpdateBodySchema,
  },
  handler: async ({ session, params, body }) =>
    recipesService.updateRecipe({
      session,
      id: params.id,
      data: body,
    }),
});

export const DELETE = createRouteHandler({
  schemas: {
    params: recipeIdParamSchema,
  },
  handler: async ({ session, params }) =>
    recipesService.deleteRecipe({
      session,
      id: params.id,
    }),
});
