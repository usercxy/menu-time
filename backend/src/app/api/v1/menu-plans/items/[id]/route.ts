import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  mealPlanItemParamsSchema,
  mealPlanItemUpdateBodySchema,
} from "@/server/modules/plans/plans.schema";
import * as plansService from "@/server/modules/plans/plans.service";

export const PATCH = createRouteHandler({
  schemas: {
    params: mealPlanItemParamsSchema,
    body: mealPlanItemUpdateBodySchema,
  },
  handler: async ({ session, params, body }) =>
    plansService.updateMealPlanItem({
      session,
      id: params.id,
      data: body,
    }),
});

export const DELETE = createRouteHandler({
  schemas: {
    params: mealPlanItemParamsSchema,
  },
  handler: async ({ session, params }) =>
    plansService.deleteMealPlanItem({
      session,
      id: params.id,
    }),
});
