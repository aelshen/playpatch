/**
 * Sentry Client Configuration
 * Captures errors and performance data from the browser
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust this value in production to reduce costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set `tracePropagationTargets` to control which URLs distributed tracing should be enabled for
  // Add your production API domains here when deploying
  tracePropagationTargets: ['localhost', /^https:\/\/.*\/api/],

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  environment: process.env.NODE_ENV,

  // Filter out expected errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Don't send errors in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
      return null;
    }

    // Filter out common non-actionable errors
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);

      // Network errors that users can't fix
      if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
        return null;
      }

      // Browser extension errors
      if (message.includes('chrome-extension://')) {
        return null;
      }
    }

    return event;
  },
});
