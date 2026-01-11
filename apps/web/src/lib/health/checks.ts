/**
 * Health Check Utilities
 * Implements comprehensive service health checks
 */

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export interface HealthStatus {
  healthy: boolean;
  message?: string;
  latency?: number;
  details?: any;
}

/**
 * Check database connectivity
 */
export async function checkDatabase(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
      message: 'Database connected',
    };
  } catch (error: any) {
    logger.error('Database health check failed', { error });
    return {
      healthy: false,
      message: error.message || 'Database connection failed',
    };
  }
}

/**
 * Check Redis connectivity
 */
export async function checkRedis(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    // Dynamic import to avoid loading Redis in all contexts
    const { getRedisClient } = await import('@/lib/cache/client');
    const redis = getRedisClient();

    await redis.ping();
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
      message: 'Redis connected',
    };
  } catch (error: any) {
    logger.error('Redis health check failed', { error });
    return {
      healthy: false,
      message: error.message || 'Redis connection failed',
    };
  }
}

/**
 * Check storage backend
 */
export async function checkStorage(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const { fileExists, BUCKETS } = await import('@/lib/storage/client');

    // Try to list files in videos bucket (simple check)
    // Just check if bucket is accessible without listing all files
    await fileExists(BUCKETS.VIDEOS, '.healthcheck');
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
      message: 'Storage accessible',
    };
  } catch (error: any) {
    // Storage might fail if file doesn't exist, but that's okay
    // We just want to make sure the bucket is accessible
    if (error.message?.includes('not yet migrated')) {
      return {
        healthy: true,
        message: 'Storage using local filesystem',
      };
    }

    logger.error('Storage health check failed', { error });
    return {
      healthy: false,
      message: error.message || 'Storage not accessible',
    };
  }
}

/**
 * Check Meilisearch
 */
export async function checkMeilisearch(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const { getMeilisearchClient } = await import('@/lib/search/client');
    const client = getMeilisearchClient();

    const health = await client.health();
    const latency = Date.now() - start;

    return {
      healthy: health.status === 'available',
      latency,
      message: `Meilisearch ${health.status}`,
      details: health,
    };
  } catch (error: any) {
    logger.error('Meilisearch health check failed', { error });
    return {
      healthy: false,
      message: error.message || 'Meilisearch not accessible',
    };
  }
}

/**
 * Check all services and return aggregate health
 */
export async function checkAllServices() {
  const [database, redis, storage, search] = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkStorage(),
    checkMeilisearch(),
  ]);

  const services = {
    database: database.status === 'fulfilled' ? database.value : { healthy: false, message: 'Check failed' },
    redis: redis.status === 'fulfilled' ? redis.value : { healthy: false, message: 'Check failed' },
    storage: storage.status === 'fulfilled' ? storage.value : { healthy: false, message: 'Check failed' },
    search: search.status === 'fulfilled' ? search.value : { healthy: false, message: 'Check failed' },
  };

  const allHealthy = Object.values(services).every((s) => s.healthy);
  const criticalHealthy = services.database.healthy && services.redis.healthy;

  return {
    overall: allHealthy ? 'healthy' : criticalHealthy ? 'degraded' : 'unhealthy',
    services,
    timestamp: new Date().toISOString(),
  };
}
