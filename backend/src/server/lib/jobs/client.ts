import "server-only";

import { PgBoss } from "pg-boss";

import { getEnv } from "@/server/lib/env";

let bossPromise: Promise<PgBoss> | null = null;

export async function getJobQueue() {
  const env = getEnv();

  if (!env.ENABLE_JOB_WORKER) {
    return null;
  }

  if (!bossPromise) {
    bossPromise = (async () => {
      const boss = new PgBoss({
        connectionString: env.DATABASE_URL,
        schema: env.PG_BOSS_SCHEMA,
      });

      await boss.start();
      return boss;
    })();
  }

  return bossPromise;
}
