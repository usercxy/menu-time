import { getEnv } from "@/server/lib/env";
import { getLogger } from "@/server/lib/logger";

export async function register() {
  const env = getEnv();

  getLogger({ scope: "startup" }).info(
    {
      appName: env.APP_NAME,
      nodeEnv: env.NODE_ENV,
    },
    "startup configuration validated",
  );
}
