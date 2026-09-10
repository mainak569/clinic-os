import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Configuration
 * 
 * This file provides centralized Prisma client configuration for the application.
 * It ensures proper connection pooling and prevents multiple instances in development.
 * 
 * Note: Edge-compatible - no process.on or query logging
 */

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
export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Ensures database connections are properly closed
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
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
