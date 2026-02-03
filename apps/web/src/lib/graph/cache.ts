/**
 * Graph Cache Service
 * Redis-based caching for graph queries with <10ms response target
 */

import * as cache from '@/lib/cache/client';
import { logger } from '@/lib/logger';
import type {
  GraphResponse,
  GraphCacheKey,
  FullGraphParams,
  VideoGraphParams,
  CategoryGraphParams,
  TopicNeighborhoodParams,
} from './types';

// Cache TTL: 1 hour as specified in success criteria
const GRAPH_CACHE_TTL = 3600; // seconds

/**
 * Generate cache key for different query types
 */
export function getCacheKey(
  type: 'full' | 'video' | 'category' | 'neighborhood',
  params: FullGraphParams | VideoGraphParams | CategoryGraphParams | TopicNeighborhoodParams
): GraphCacheKey {
  const { childId } = params;

  switch (type) {
    case 'full': {
      const limit = (params as FullGraphParams).limit || 50;
      return `graph:child:${childId}:full:${limit}`;
    }
    case 'video':
      return `graph:child:${childId}:video:${(params as VideoGraphParams).videoId}`;
    case 'category':
      return `graph:child:${childId}:category:${(params as CategoryGraphParams).category}`;
    case 'neighborhood':
      return `graph:child:${childId}:topic:${(params as TopicNeighborhoodParams).topicId}`;
  }
}

/**
 * Get graph from cache
 * Returns null if not cached or expired
 */
export async function getGraphFromCache(
  type: 'full' | 'video' | 'category' | 'neighborhood',
  params: FullGraphParams | VideoGraphParams | CategoryGraphParams | TopicNeighborhoodParams
): Promise<GraphResponse | null> {
  const startTime = Date.now();
  const key = getCacheKey(type, params);

  try {
    const cached = await cache.get<GraphResponse>(key);

    const duration = Date.now() - startTime;
    if (duration > 10) {
      logger.warn({
        message: 'Graph cache lookup exceeded 10ms target',
        key,
        duration,
      });
    }

    if (cached) {
      logger.debug({ message: 'Graph cache hit', key, duration });
    }

    return cached;
  } catch (error) {
    logger.error({
      message: 'Graph cache get error',
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Store graph in cache with 1-hour TTL
 */
export async function setGraphInCache(
  type: 'full' | 'video' | 'category' | 'neighborhood',
  params: FullGraphParams | VideoGraphParams | CategoryGraphParams | TopicNeighborhoodParams,
  data: GraphResponse
): Promise<void> {
  const key = getCacheKey(type, params);

  try {
    // Add cache timestamp to response
    const dataWithMeta = {
      ...data,
      meta: {
        ...data.meta,
        cachedAt: new Date().toISOString(),
      },
    };

    await cache.set(key, dataWithMeta, GRAPH_CACHE_TTL);
    logger.debug({ message: 'Graph cached', key, ttl: GRAPH_CACHE_TTL });
  } catch (error) {
    logger.error({
      message: 'Graph cache set error',
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - cache failures shouldn't break the app
  }
}

/**
 * Invalidate graph cache for a child
 * Called when watch session completes or graph is rebuilt
 */
export async function invalidateGraphCache(childId: string): Promise<void> {
  try {
    // Find all cache keys for this child
    const pattern = `graph:child:${childId}:*`;
    const keys = await cache.keys(pattern);

    if (keys.length > 0) {
      await cache.mdel(keys);
      logger.info({
        message: 'Graph cache invalidated',
        childId,
        keysDeleted: keys.length,
      });
    }
  } catch (error) {
    logger.error({
      message: 'Graph cache invalidation error',
      childId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Invalidate specific cache entry
 * Used for targeted invalidation when a single video is watched
 */
export async function invalidateSpecificCache(
  type: 'full' | 'video' | 'category' | 'neighborhood',
  params: FullGraphParams | VideoGraphParams | CategoryGraphParams | TopicNeighborhoodParams
): Promise<void> {
  const key = getCacheKey(type, params);

  try {
    await cache.del(key);
    logger.debug({ message: 'Specific graph cache invalidated', key });
  } catch (error) {
    logger.error({
      message: 'Specific graph cache invalidation error',
      key,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
