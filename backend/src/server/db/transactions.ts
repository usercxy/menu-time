import { type Prisma, type PrismaClient } from "@prisma/client";

import { getPrismaClient } from "@/server/db/client";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return getPrismaClient().$transaction((tx: Prisma.TransactionClient) =>
    callback(tx),
  );
}
