/**
 * Integration test for health check endpoint
 * Tests the actual API route
 */

import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

// Mock all health check functions
jest.mock('@/lib/health/checks', () => ({
  checkAllServices: jest.fn(),
}));

import { checkAllServices } from '@/lib/health/checks';

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 when all services are healthy', async () => {
    (checkAllServices as jest.Mock).mockResolvedValue({
      overall: 'healthy',
      services: {
        database: { healthy: true, latency: 10 },
        redis: { healthy: true, latency: 5 },
        storage: { healthy: true, latency: 8 },
        search: { healthy: true, latency: 12 },
      },
      timestamp: new Date().toISOString(),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall).toBe('healthy');
    expect(data.services.database.healthy).toBe(true);
  });

  it('should return 200 when services are degraded', async () => {
    (checkAllServices as jest.Mock).mockResolvedValue({
      overall: 'degraded',
      services: {
        database: { healthy: true, latency: 10 },
        redis: { healthy: true, latency: 5 },
        storage: { healthy: true, latency: 8 },
        search: { healthy: false, message: 'Connection failed' },
      },
      timestamp: new Date().toISOString(),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall).toBe('degraded');
    expect(data.services.search.healthy).toBe(false);
  });

  it('should return 503 when services are unhealthy', async () => {
    (checkAllServices as jest.Mock).mockResolvedValue({
      overall: 'unhealthy',
      services: {
        database: { healthy: false, message: 'Connection failed' },
        redis: { healthy: false, message: 'Connection failed' },
        storage: { healthy: true, latency: 8 },
        search: { healthy: true, latency: 12 },
      },
      timestamp: new Date().toISOString(),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.overall).toBe('unhealthy');
  });

  it('should return 503 on error', async () => {
    (checkAllServices as jest.Mock).mockRejectedValue(new Error('System error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.overall).toBe('unhealthy');
    expect(data.error).toBeDefined();
  });

  it('should include timestamp in response', async () => {
    (checkAllServices as jest.Mock).mockResolvedValue({
      overall: 'healthy',
      services: {},
      timestamp: '2026-01-10T12:00:00.000Z',
    });

    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toBe('2026-01-10T12:00:00.000Z');
  });
});
