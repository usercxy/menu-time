import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  mealPlanReorderBodySchema,
  mealPlanWeekParamsSchema,
} from "@/server/modules/plans/plans.schema";
import * as plansService from "@/server/modules/plans/plans.service";

export const POST = createRouteHandler({
  schemas: {
    params: mealPlanWeekParamsSchema,
    body: mealPlanReorderBodySchema,
  },
  handler: async ({ session, params, body }) =>
    plansService.reorderMealPlanItems({
      session,
      weekStartDate: params.weekStartDate,
      data: body,
    }),
});
