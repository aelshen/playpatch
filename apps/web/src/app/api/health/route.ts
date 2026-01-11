import { NextResponse } from 'next/server';
import { checkAllServices } from '@/lib/health/checks';

/**
 * Health Check Endpoint
 * Returns the health status of all services
 */
export async function GET() {
  try {
    const health = await checkAllServices();

    // Return 503 if unhealthy, 200 if healthy or degraded
    const statusCode = health.overall === 'unhealthy' ? 503 : 200;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        overall: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
