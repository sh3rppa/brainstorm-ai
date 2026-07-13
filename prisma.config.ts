import "dotenv/config";
import { defineConfig } from "prisma/config";

const pooledDatabaseUrl = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const directDatabaseUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DIRECT_URL ??
  process.env.POSTGRES_DIRECT_URL;
const isMigrationCommand = process.argv.slice(2).join(" ").startsWith("migrate ");
const databaseUrl = getPrismaCliDatabaseUrl();

function getPrismaCliDatabaseUrl(): string {
  if (isMigrationCommand) {
    if (!directDatabaseUrl) {
      throw new Error(
        "Direct database URL is required for Prisma migrations. Set DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING, DIRECT_URL, or POSTGRES_DIRECT_URL.",
      );
    }
    return directDatabaseUrl;
  }

  return directDatabaseUrl ?? pooledDatabaseUrl ?? "";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: databaseUrl,
  },
});
