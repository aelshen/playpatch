import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create PrismaClient with connection retry and pool configuration
 */
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

/**
 * Initialize Prisma with automatic reconnection
 */
let prismaInstance: PrismaClient | undefined = globalForPrisma.prisma;

if (!prismaInstance) {
  prismaInstance = createPrismaClient();

  // Add connection retry middleware
  prismaInstance.$use(async (params, next) => {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await next(params);
      } catch (error: any) {
        lastError = error;

        // Check if it's a connection error
        const isConnectionError =
          error.code === 'P1001' || // Can't reach database server
          error.code === 'P1002' || // Database timeout
          error.message?.includes('Can\'t reach database') ||
          error.message?.includes('Connection refused') ||
          error.message?.includes('ECONNREFUSED');

        if (isConnectionError && attempt < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`[Prisma] Connection error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Try to reconnect
          try {
            await prismaInstance!.$connect();
          } catch (connectError) {
            console.error('[Prisma] Reconnection attempt failed:', connectError);
          }
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance!;

// Graceful shutdown
const cleanup = async () => {
  await prisma.$disconnect();
};

process.on('beforeExit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

export default prisma;
