import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "../generated/prisma/client.js";
const globalForPrisma = global;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg(connectionString);
export const prisma = globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        // log: ['query', 'info', 'warn', 'error'],
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;
export * from "../generated/prisma/client.js";
