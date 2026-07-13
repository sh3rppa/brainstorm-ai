import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  brainstormPrisma?: PrismaClient;
};

function getPooledDatabaseUrl(): string {
  const databaseUrl = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error("Database URL is not configured. Set POSTGRES_PRISMA_URL, DATABASE_URL, or POSTGRES_URL.");
  }
  return databaseUrl;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getPooledDatabaseUrl() });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  globalForPrisma.brainstormPrisma ??= createPrismaClient();
  return globalForPrisma.brainstormPrisma;
}
