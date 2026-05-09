import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  shoppingListItemParamsSchema,
  shoppingListItemUpdateBodySchema,
} from "@/server/modules/shopping/shopping.schema";
import * as shoppingService from "@/server/modules/shopping/shopping.service";

export const PATCH = createRouteHandler({
  schemas: {
    params: shoppingListItemParamsSchema,
    body: shoppingListItemUpdateBodySchema,
  },
  handler: async ({ session, params, body }) =>
    shoppingService.updateShoppingListItem({
      session,
      id: params.id,
      data: body,
    }),
});
