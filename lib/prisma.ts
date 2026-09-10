/**
 * Prisma Client Instance
 * 
 * This is a re-export of the Prisma client from the root configuration.
 * Import this file in your application code for database access.
 * 
 * The actual Prisma Client configuration is in the root prisma.config.ts
 * 
 * @example
 * import { prisma } from '@/lib/prisma';
 * 
 * const users = await prisma.user.findMany();
 */

export { 
  prisma, 
  checkDatabaseConnection, 
  executeTransaction, 
  disconnectPrisma 
} from '@/prisma.config';

export { prisma as default } from '@/prisma.config';
