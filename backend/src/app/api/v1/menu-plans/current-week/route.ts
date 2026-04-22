import { createRouteHandler } from "@/server/lib/api/route-handler";
import * as plansService from "@/server/modules/plans/plans.service";

export const GET = createRouteHandler({
  handler: async ({ session }) =>
    plansService.getCurrentMealPlanWeek({
      session,
    }),
});
