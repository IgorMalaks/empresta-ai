import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseConfig } from "./config";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const config = databaseConfig(
    process.env.DATABASE_URL,
    process.env.NODE_ENV === "production",
    process.env.SUPABASE_URL,
  );
  const adapter = new PrismaPg({
    ...config,
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    statement_timeout: 5_000,
    lock_timeout: 3_000,
  });
  return new PrismaClient({ adapter });
}

export function getPrismaClient() {
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}
