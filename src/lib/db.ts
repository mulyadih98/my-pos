import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function parseDatabaseUrl(urlStr?: string) {
  if (!urlStr) {
    return {
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "my_pos",
    };
  }
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname || "127.0.0.1",
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || "root"),
      password: decodeURIComponent(parsed.password || ""),
      database: parsed.pathname.replace(/^\//, "") || "my_pos",
    };
  } catch {
    return {
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "my_pos",
    };
  }
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 5,
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // log: ["query"], // optional (debug)
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
