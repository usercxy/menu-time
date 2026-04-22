import { getLogger } from "@/server/lib/logger";
import { getJobQueue } from "@/server/lib/jobs/client";
import { jobNames } from "@/server/lib/jobs/job-names";
import { refreshRecipeCoverFromMoments } from "@/server/modules/moments/moments.service";

const logger = getLogger({ module: "jobs" });

export async function startJobWorker() {
  const boss = await getJobQueue();

  if (!boss) {
    logger.info("job worker disabled by configuration");
    return null;
  }

  await boss.work(jobNames.recipeCoverRefresh, async (jobs) => {
    for (const job of jobs) {
      const data = job.data as { householdId?: string; recipeId?: string } | undefined;

      if (!data?.householdId || !data.recipeId) {
        logger.warn({ jobName: jobNames.recipeCoverRefresh }, "received invalid recipe cover refresh job");
        continue;
      }

      await refreshRecipeCoverFromMoments({
        householdId: data.householdId,
        recipeId: data.recipeId,
      });
    }
  });

  await boss.work(jobNames.shoppingShareImageGenerate, async () => {
    logger.info(
      { jobName: jobNames.shoppingShareImageGenerate },
      "received placeholder job",
    );
  });

  logger.info("job worker started");
  return boss;
}
