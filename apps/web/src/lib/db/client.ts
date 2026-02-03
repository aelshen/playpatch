import { PrismaClient } from '@prisma/client';
import { graphChildScopeMiddleware } from './middleware/graph-child-scope';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Register graph child scope middleware for isolation safety
prisma.$use(graphChildScopeMiddleware);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
