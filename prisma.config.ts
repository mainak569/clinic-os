import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Configuration
 * 
 * This file provides centralized Prisma client configuration for the application.
 * It ensures proper connection pooling and prevents multiple instances in development.
 */

// Prisma Client Options
const prismaOptions = {
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ] as const,
};

// Global type for Prisma client
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Creates or returns existing Prisma client instance
 * In development, reuses the client to avoid connection exhaustion
 * In production, creates a new client for each invocation
 */
export const prisma = global.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Optional: Add query logging in development
if (process.env.NODE_ENV === "development") {
  prisma.$on("query" as never, (e: unknown) => {
    const event = e as { query: string; params: string; duration: number };
    console.log("Query: " + event.query);
    console.log("Params: " + event.params);
    console.log("Duration: " + event.duration + "ms");
  });
}

/**
 * Graceful shutdown handler
 * Ensures database connections are properly closed
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Handle process termination
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    await disconnectPrisma();
  });
}

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

/**
 * Database transaction helper
 * Executes multiple operations in a single transaction
 */
export async function executeTransaction<T>(
  operations: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await operations(tx as PrismaClient);
  });
}

export default prisma;
