/**
 * Sentry Server Configuration
 * Captures errors from Next.js server-side code (API routes, getServerSideProps, etc.)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust this value in production to reduce costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  environment: process.env.NODE_ENV,

  // Filter out expected errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Don't send errors in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }

    // Filter out database connection errors during shutdown
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);

      if (message.includes('Connection terminated') || message.includes('ECONNRESET')) {
        return null;
      }
    }

    return event;
  },

  // Add context to all events
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    return breadcrumb;
  },
});
