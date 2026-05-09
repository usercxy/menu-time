import { createRouteHandler } from "@/server/lib/api/route-handler";
import { shoppingListParamsSchema } from "@/server/modules/shopping/shopping.schema";
import * as shoppingService from "@/server/modules/shopping/shopping.service";

export const GET = createRouteHandler({
  schemas: {
    params: shoppingListParamsSchema,
  },
  handler: async ({ session, params }) =>
    shoppingService.getShoppingListDetail({
      session,
      id: params.id,
    }),
});
