/**
 * Sentry Test Endpoint
 * GET /api/sentry-test - Throws a test error to verify Sentry is working
 * DELETE THIS FILE AFTER VERIFYING SENTRY IS WORKING
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    // Add some context
    Sentry.setContext('test', {
      endpoint: '/api/sentry-test',
      timestamp: new Date().toISOString(),
    });

    Sentry.setTag('test', 'sentry-verification');

    // Throw a test error
    throw new Error('🧪 Sentry Test Error - If you see this in Sentry, everything is working!');
  } catch (error) {
    // Capture the error in Sentry
    Sentry.captureException(error, {
      level: 'info',
      tags: {
        test: 'true',
        endpoint: 'sentry-test',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Test error sent to Sentry!',
        note: 'Check your Sentry dashboard in a few seconds.',
        dsn: process.env.SENTRY_DSN ? '✓ Configured' : '✗ Not configured',
      },
      { status: 200 }
    );
  }
}
