/**
 * Redis Cache Client
 * SSK-006: Redis Integration
 */

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

/**
 * Get value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  return JSON.parse(value) as T;
}

/**
 * Set value in cache
 */
export async function set(key: string, value: unknown, ttl?: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttl) {
    await redis.setex(key, ttl, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

/**
 * Delete key from cache
 */
export async function del(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Check if key exists
 */
export async function exists(key: string): Promise<boolean> {
  const result = await redis.exists(key);
  return result === 1;
}

/**
 * Set with expiry (alternative to set with ttl)
 */
export async function setex(key: string, seconds: number, value: unknown): Promise<void> {
  await redis.setex(key, seconds, JSON.stringify(value));
}

/**
 * Increment counter
 */
export async function incr(key: string): Promise<number> {
  return await redis.incr(key);
}

/**
 * Increment counter with expiry
 */
export async function incrWithExpiry(key: string, ttl: number): Promise<number> {
  const value = await redis.incr(key);
  if (value === 1) {
    await redis.expire(key, ttl);
  }
  return value;
}

/**
 * Get multiple keys
 */
export async function mget<T>(keys: string[]): Promise<(T | null)[]> {
  const values = await redis.mget(...keys);
  return values.map((v) => (v ? (JSON.parse(v) as T) : null));
}

/**
 * Delete multiple keys
 */
export async function mdel(keys: string[]): Promise<void> {
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Get all keys matching pattern
 */
export async function keys(pattern: string): Promise<string[]> {
  return await redis.keys(pattern);
}

/**
 * Rate limiting helper
 */
export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Use sorted set for sliding window
  await redis.zremrangebyscore(key, 0, now - windowMs);
  const count = await redis.zcard(key);

  if (count >= maxRequests) {
    const oldestTimestamp = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetAt = new Date(parseInt(oldestTimestamp[1]) + windowMs);
    return { allowed: false, remaining: 0, resetAt };
  }

  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, windowSeconds);

  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    resetAt: new Date(now + windowMs),
  };
}

/**
 * Session storage helpers
 */
export const session = {
  get: async (sessionId: string) => {
    return await get(`session:${sessionId}`);
  },
  set: async (sessionId: string, data: unknown, ttl: number = 86400) => {
    await set(`session:${sessionId}`, data, ttl);
  },
  delete: async (sessionId: string) => {
    await del(`session:${sessionId}`);
  },
};

export { redis };
export default redis;
