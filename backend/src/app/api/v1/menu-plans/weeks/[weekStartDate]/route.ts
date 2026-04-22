import { createRouteHandler } from "@/server/lib/api/route-handler";
import { mealPlanWeekParamsSchema } from "@/server/modules/plans/plans.schema";
import * as plansService from "@/server/modules/plans/plans.service";

export const GET = createRouteHandler({
  schemas: {
    params: mealPlanWeekParamsSchema,
  },
  handler: async ({ session, params }) =>
    plansService.getMealPlanWeek({
      session,
      weekStartDate: params.weekStartDate,
    }),
});
