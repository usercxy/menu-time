import { createRouteHandler } from "@/server/lib/api/route-handler";
import { shoppingListGenerateBodySchema } from "@/server/modules/shopping/shopping.schema";
import * as shoppingService from "@/server/modules/shopping/shopping.service";

export const POST = createRouteHandler({
  schemas: {
    body: shoppingListGenerateBodySchema,
  },
  successStatus: 201,
  handler: async ({ session, body }) =>
    shoppingService.generateShoppingList({
      session,
      data: body,
    }),
});
