import { getLogger } from "@/server/lib/logger";
import { getJobQueue } from "@/server/lib/jobs/client";
import { jobNames } from "@/server/lib/jobs/job-names";

const logger = getLogger({ module: "jobs" });

export async function startJobWorker() {
  const boss = await getJobQueue();

  if (!boss) {
    logger.info("job worker disabled by configuration");
    return null;
  }

  await boss.work(jobNames.recipeCoverRefresh, async () => {
    logger.info({ jobName: jobNames.recipeCoverRefresh }, "received placeholder job");
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
