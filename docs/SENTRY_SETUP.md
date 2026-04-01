# Sentry Error Tracking Setup

PlayPatch uses [Sentry](https://sentry.io) for error tracking and performance monitoring in production.

## Features

- **Error Tracking**: Automatically captures and reports errors from client and server
- **Performance Monitoring**: Tracks API response times and page load performance
- **Session Replay**: Records user sessions when errors occur (10% sample rate)
- **Context**: Captures user info, request details, and breadcrumbs
- **Filtering**: Excludes noisy errors (network issues, browser extensions, dev mode)

## Setup Instructions

### 1. Create Sentry Account

1. Sign up at [sentry.io](https://sentry.io) (free tier available)
2. Create a new project:
   - Platform: **Next.js**
   - Project name: **playpatch** (or your choice)
3. Copy your DSN from the project settings

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Sentry DSN (same value for both)
SENTRY_DSN=https://your-key@o0000000.ingest.sentry.io/0000000
NEXT_PUBLIC_SENTRY_DSN=https://your-key@o0000000.ingest.sentry.io/0000000

# Optional: Sentry organization and project (for source map uploads)
SENTRY_ORG=your-org-name
SENTRY_PROJECT=playpatch

# Optional: Enable Sentry in development mode
# SENTRY_DEBUG=true
# NEXT_PUBLIC_SENTRY_DEBUG=true
```

**Important:**
- `SENTRY_DSN` is for server-side error tracking
- `NEXT_PUBLIC_SENTRY_DSN` is for client-side error tracking
- Both should use the **same DSN value**

### 3. Test Sentry

1. Start your development server:
   ```bash
   pnpm dev:all
   ```

2. Visit the test endpoint:
   ```bash
   curl http://localhost:3000/api/sentry-test
   ```

3. Check your Sentry dashboard at https://sentry.io
   - You should see a test error within 10-30 seconds
   - Look for: "🧪 Sentry Test Error - If you see this in Sentry, everything is working!"

4. **Delete the test endpoint after verification:**
   ```bash
   rm apps/web/src/app/api/sentry-test/route.ts
   ```

## Configuration

### Error Filtering

Sentry is configured to filter out:

**Client-side (sentry.client.config.ts):**
- Network errors (`Failed to fetch`, `NetworkError`)
- Browser extension errors (`chrome-extension://`)
- Development mode errors (unless `NEXT_PUBLIC_SENTRY_DEBUG=true`)

**Server-side (sentry.server.config.ts):**
- Database connection errors during shutdown
- `ECONNRESET` errors
- Development mode errors (unless `SENTRY_DEBUG=true`)

### Sample Rates

**Production:**
- Performance traces: 10% of requests
- Session replays: 10% of sessions
- Error replays: 100% of sessions with errors

**Development:**
- Performance traces: 100% (when enabled)
- Errors: Disabled by default (set `SENTRY_DEBUG=true` to enable)

### Adjusting Sample Rates

Edit `sentry.client.config.ts` and `sentry.server.config.ts`:

```typescript
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
replaysSessionSampleRate: 0.1,  // Increase for more replays
replaysOnErrorSampleRate: 1.0,  // Always replay on errors
```

## Using Sentry in Code

### Capture Custom Errors

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      feature: 'video-import',
      source: 'youtube',
    },
    extra: {
      videoId: 'abc123',
      metadata: importData,
    },
  });
  throw error;
}
```

### Add Context

```typescript
import * as Sentry from '@sentry/nextjs';

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Set custom context
Sentry.setContext('video', {
  id: video.id,
  title: video.title,
  duration: video.duration,
});

// Add tags
Sentry.setTag('family_id', familyId);
Sentry.setTag('profile_id', profileId);
```

### Capture Messages

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureMessage('Unusual activity detected', {
  level: 'warning',
  tags: {
    feature: 'ai-chat',
    severity: 'medium',
  },
});
```

## Production Best Practices

1. **Source Maps**: Upload source maps to Sentry for better stack traces
   - Set `SENTRY_AUTH_TOKEN` in CI/CD
   - Sentry will automatically upload during build

2. **Release Tracking**: Tag errors with release versions
   - Set `SENTRY_RELEASE` environment variable
   - Helps identify when bugs were introduced

3. **Alerts**: Configure alert rules in Sentry dashboard
   - Email/Slack notifications for critical errors
   - Set thresholds (e.g., >10 errors/minute)

4. **Performance**: Monitor slow API routes
   - Sentry captures response times automatically
   - Use "Performance" tab in dashboard

5. **Session Replay**: Review user sessions when errors occur
   - Helps understand how users triggered bugs
   - Privacy-safe (filters sensitive data)

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN is configured:
   ```bash
   echo $SENTRY_DSN
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. Verify Sentry is initialized:
   - Check browser console for Sentry initialization messages
   - Look for `[Sentry]` logs

3. Enable debug mode:
   ```bash
   SENTRY_DEBUG=true
   NEXT_PUBLIC_SENTRY_DEBUG=true
   ```

4. Test with `/api/sentry-test` endpoint

### Too Many Errors

1. Adjust sample rates in config files
2. Add more filters in `beforeSend` hooks
3. Use `ignoreErrors` option to exclude error patterns

### Source Maps Not Working

1. Ensure `SENTRY_AUTH_TOKEN` is set in production builds
2. Check that `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry project
3. Verify source maps are being uploaded during build

## Costs

Sentry pricing is based on:
- **Events**: Errors and transactions captured
- **Replays**: Session recordings
- **Attachments**: Screenshots and files

**Free tier includes:**
- 5,000 errors/month
- 500 replays/month
- 10,000 performance units/month

**Tips to stay in free tier:**
- Use sampling (10% traces, 10% replays)
- Filter out noisy errors
- Use development mode filters

## Disabling Sentry

To disable Sentry completely:

1. Remove or comment out environment variables:
   ```bash
   # SENTRY_DSN=...
   # NEXT_PUBLIC_SENTRY_DSN=...
   ```

2. Restart your server:
   ```bash
   pnpm dev:all
   ```

Sentry will not initialize without a DSN configured.

## Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

---

**Last Updated:** 2026-02-02
