import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  recipeIdParamSchema,
  recipeVersionCreateBodySchema,
  recipeVersionsListQuerySchema,
} from "@/server/modules/recipes/recipes.schema";
import * as recipesService from "@/server/modules/recipes/recipes.service";

export const GET = createRouteHandler({
  schemas: {
    params: recipeIdParamSchema,
    query: recipeVersionsListQuerySchema,
  },
  handler: async ({ session, params, query }) =>
    recipesService.listRecipeVersions({
      session,
      recipeId: params.id,
      page: query.page,
      pageSize: query.pageSize,
    }),
});

export const POST = createRouteHandler({
  schemas: {
    params: recipeIdParamSchema,
    body: recipeVersionCreateBodySchema,
  },
  successStatus: 201,
  handler: async ({ session, params, body }) =>
    recipesService.createRecipeVersion({
      session,
      recipeId: params.id,
      data: body,
    }),
});
