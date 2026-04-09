import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  recipeCreateBodySchema,
  recipeListQuerySchema,
} from "@/server/modules/recipes/recipes.schema";
import * as recipesService from "@/server/modules/recipes/recipes.service";

export const GET = createRouteHandler({
  schemas: {
    query: recipeListQuerySchema,
  },
  handler: async ({ session, query }) =>
    recipesService.listRecipes({
      session,
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword,
      categoryId: query.categoryId,
      tagIds: query.tagIds,
      sortBy: query.sortBy,
    }),
});

export const POST = createRouteHandler({
  schemas: {
    body: recipeCreateBodySchema,
  },
  successStatus: 201,
  handler: async ({ session, body }) =>
    recipesService.createRecipe({
      session,
      data: body,
    }),
});
