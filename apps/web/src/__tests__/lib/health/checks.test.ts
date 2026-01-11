/**
 * Unit tests for health check utilities
 */

import {
  checkDatabase,
  checkRedis,
  checkStorage,
  checkMeilisearch,
  checkAllServices,
} from '@/lib/health/checks';

// Mock dependencies
jest.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('@/lib/cache/client', () => ({
  getRedisClient: jest.fn(() => ({
    ping: jest.fn(),
  })),
}));

jest.mock('@/lib/storage/client', () => ({
  fileExists: jest.fn(),
  BUCKETS: {
    VIDEOS: 'videos',
    THUMBNAILS: 'thumbnails',
  },
}));

jest.mock('@/lib/search/client', () => ({
  getMeilisearchClient: jest.fn(() => ({
    health: jest.fn(),
  })),
}));

import { prisma } from '@/lib/db/client';

describe('Health Check Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabase', () => {
    it('should return healthy status when database is accessible', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);

      const result = await checkDatabase();

      expect(result.healthy).toBe(true);
      expect(result.message).toBe('Database connected');
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should return unhealthy status when database is not accessible', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const result = await checkDatabase();

      expect(result.healthy).toBe(false);
      expect(result.message).toContain('Connection failed');
    });

    it('should measure latency', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);

      const result = await checkDatabase();

      expect(result.latency).toBeDefined();
      expect(typeof result.latency).toBe('number');
    });
  });

  describe('checkRedis', () => {
    it('should return healthy status when Redis is accessible', async () => {
      const { getRedisClient } = await import('@/lib/cache/client');
      const mockRedis = (getRedisClient as jest.Mock)();
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await checkRedis();

      expect(result.healthy).toBe(true);
      expect(result.message).toBe('Redis connected');
    });

    it('should return unhealthy status when Redis is not accessible', async () => {
      const { getRedisClient } = await import('@/lib/cache/client');
      const mockRedis = (getRedisClient as jest.Mock)();
      mockRedis.ping.mockRejectedValue(new Error('Connection refused'));

      const result = await checkRedis();

      expect(result.healthy).toBe(false);
      expect(result.message).toContain('Connection refused');
    });
  });

  describe('checkStorage', () => {
    it('should return healthy status when storage is accessible', async () => {
      const { fileExists } = await import('@/lib/storage/client');
      (fileExists as jest.Mock).mockResolvedValue(false);

      const result = await checkStorage();

      expect(result.healthy).toBe(true);
      expect(result.message).toBe('Storage accessible');
    });

    it('should handle local storage gracefully', async () => {
      const { fileExists } = await import('@/lib/storage/client');
      (fileExists as jest.Mock).mockRejectedValue(new Error('not yet migrated'));

      const result = await checkStorage();

      expect(result.healthy).toBe(true);
      expect(result.message).toBe('Storage using local filesystem');
    });

    it('should return unhealthy status for real storage errors', async () => {
      const { fileExists } = await import('@/lib/storage/client');
      (fileExists as jest.Mock).mockRejectedValue(new Error('Storage unavailable'));

      const result = await checkStorage();

      expect(result.healthy).toBe(false);
      expect(result.message).toContain('Storage unavailable');
    });
  });

  describe('checkMeilisearch', () => {
    it('should return healthy status when Meilisearch is available', async () => {
      const { getMeilisearchClient } = await import('@/lib/search/client');
      const mockClient = (getMeilisearchClient as jest.Mock)();
      mockClient.health.mockResolvedValue({ status: 'available' });

      const result = await checkMeilisearch();

      expect(result.healthy).toBe(true);
      expect(result.message).toContain('available');
    });

    it('should return unhealthy status when Meilisearch is unavailable', async () => {
      const { getMeilisearchClient } = await import('@/lib/search/client');
      const mockClient = (getMeilisearchClient as jest.Mock)();
      mockClient.health.mockResolvedValue({ status: 'unavailable' });

      const result = await checkMeilisearch();

      expect(result.healthy).toBe(false);
    });

    it('should handle connection errors', async () => {
      const { getMeilisearchClient } = await import('@/lib/search/client');
      const mockClient = (getMeilisearchClient as jest.Mock)();
      mockClient.health.mockRejectedValue(new Error('Network error'));

      const result = await checkMeilisearch();

      expect(result.healthy).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('checkAllServices', () => {
    beforeEach(() => {
      // Setup all mocks as healthy by default
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
    });

    it('should return healthy when all services are healthy', async () => {
      const { getRedisClient } = await import('@/lib/cache/client');
      const { fileExists } = await import('@/lib/storage/client');
      const { getMeilisearchClient } = await import('@/lib/search/client');

      (getRedisClient as jest.Mock)().ping.mockResolvedValue('PONG');
      (fileExists as jest.Mock).mockResolvedValue(false);
      (getMeilisearchClient as jest.Mock)().health.mockResolvedValue({ status: 'available' });

      const result = await checkAllServices();

      expect(result.overall).toBe('healthy');
      expect(result.services.database.healthy).toBe(true);
      expect(result.services.redis.healthy).toBe(true);
      expect(result.services.storage.healthy).toBe(true);
      expect(result.services.search.healthy).toBe(true);
    });

    it('should return degraded when non-critical service is down', async () => {
      const { getRedisClient } = await import('@/lib/cache/client');
      const { fileExists } = await import('@/lib/storage/client');
      const { getMeilisearchClient } = await import('@/lib/search/client');

      (getRedisClient as jest.Mock)().ping.mockResolvedValue('PONG');
      (fileExists as jest.Mock).mockResolvedValue(false);
      (getMeilisearchClient as jest.Mock)().health.mockRejectedValue(new Error('Down'));

      const result = await checkAllServices();

      expect(result.overall).toBe('degraded');
      expect(result.services.database.healthy).toBe(true);
      expect(result.services.redis.healthy).toBe(true);
      expect(result.services.search.healthy).toBe(false);
    });

    it('should return unhealthy when database is down', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB Down'));

      const result = await checkAllServices();

      expect(result.overall).toBe('unhealthy');
      expect(result.services.database.healthy).toBe(false);
    });

    it('should return unhealthy when Redis is down', async () => {
      const { getRedisClient } = await import('@/lib/cache/client');
      (getRedisClient as jest.Mock)().ping.mockRejectedValue(new Error('Redis Down'));

      const result = await checkAllServices();

      expect(result.overall).toBe('unhealthy');
      expect(result.services.redis.healthy).toBe(false);
    });

    it('should include timestamp in result', async () => {
      const result = await checkAllServices();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});
