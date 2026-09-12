import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { parse } from "pg-connection-string";

if (!process.env.DATABASE_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config();
  } catch {}
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL || "";
const isRemote =
  connectionString.includes("supabase.co") ||
  connectionString.includes("pooler.supabase.com") ||
  connectionString.includes("sslmode=");

function getPoolConfig() {
  if (!connectionString) return {};
  try {
    const config = parse(connectionString) as any;
    if (isRemote) {
      config.ssl = { rejectUnauthorized: false };
    }
    config.max = 10;
    config.idleTimeoutMillis = 30000;
    return config;
  } catch {
    return {
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
    };
  }
}

const pool = globalForPrisma.pool ?? new Pool(getPoolConfig());

const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.pool = pool;
}
