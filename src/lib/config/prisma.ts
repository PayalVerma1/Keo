import "./prefer-ipv4";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({
    connectionString,
    // Keep cloud-pooler connections short-lived to avoid reusing stale sockets.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    maxLifetimeSeconds: 60,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });

  pool.on("error", (err) => {
    console.error("Unexpected pg pool error:", err);
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function databaseErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Database request failed";
  const extra = error as Error & { code?: string; errors?: Array<{ message?: string; code?: string }> };
  const nested = extra.errors
    ?.map((entry) => entry.message || entry.code)
    .filter(Boolean)
    .join("; ");
  const text = [extra.message, extra.code, nested].filter(Boolean).join(" — ");
  return text || "Database connection failed (check DATABASE_URL / network)";
}

export * from "../generated/prisma";
