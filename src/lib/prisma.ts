import { PrismaClient } from "@prisma/client";
import path from "path";

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const userData = process.env.USER_DATA_PATH;
  if (userData) {
    const dbPath = path.join(userData, "autogestao.db");
    return `file:${dbPath.replace(/\\/g, "/")}`;
  }
  return "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
