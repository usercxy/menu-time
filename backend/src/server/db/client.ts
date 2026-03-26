import "server-only";

import { PrismaClient } from "@prisma/client";

declare global {
  var __menuTimePrisma__: PrismaClient | undefined;
}

export function getPrismaClient() {
  if (!globalThis.__menuTimePrisma__) {
    globalThis.__menuTimePrisma__ = new PrismaClient();
  }

  return globalThis.__menuTimePrisma__;
}
