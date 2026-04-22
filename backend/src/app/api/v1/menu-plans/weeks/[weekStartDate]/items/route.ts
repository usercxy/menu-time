import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  mealPlanItemCreateBodySchema,
  mealPlanWeekParamsSchema,
} from "@/server/modules/plans/plans.schema";
import * as plansService from "@/server/modules/plans/plans.service";

export const POST = createRouteHandler({
  schemas: {
    params: mealPlanWeekParamsSchema,
    body: mealPlanItemCreateBodySchema,
  },
  successStatus: 201,
  handler: async ({ session, params, body }) =>
    plansService.createMealPlanItem({
      session,
      weekStartDate: params.weekStartDate,
      data: body,
    }),
});
