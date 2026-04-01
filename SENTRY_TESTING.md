# Sentry Testing Instructions

## Current Status

✅ **Sentry is fully configured and ready**
⚠️ **Network blocking issue detected on current machine**

## Issue Identified

When testing on current machine:
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
URL: o4510817971077120.ingest.de.sentry.io
```

**Cause:** Ad blocker, browser extension, or network firewall blocking Sentry requests

## Configuration Details

**DSN (Already in apps/web/.env):**
```
https://d79c05622b7f13b522c0822539a59fa5@o4510817971077120.ingest.de.sentry.io/4510818071740496
```

**Environment Variables Set:**
```bash
SENTRY_DSN=<DSN>
NEXT_PUBLIC_SENTRY_DSN=<DSN>
SENTRY_DEBUG=true
NEXT_PUBLIC_SENTRY_DEBUG=true
```

## Testing on Another Machine

### Quick Test (5 minutes)

1. **Pull latest code:**
   ```bash
   git checkout feature/realdebrid-integration
   git pull origin feature/realdebrid-integration
   ```

2. **Copy .env file** (or create new one):
   ```bash
   cp .env.example apps/web/.env
   ```

3. **Add Sentry DSN to apps/web/.env:**
   ```bash
   # Add these lines:
   SENTRY_DSN=https://d79c05622b7f13b522c0822539a59fa5@o4510817971077120.ingest.de.sentry.io/4510818071740496
   NEXT_PUBLIC_SENTRY_DSN=https://d79c05622b7f13b522c0822539a59fa5@o4510817971077120.ingest.de.sentry.io/4510818071740496
   SENTRY_DEBUG=true
   NEXT_PUBLIC_SENTRY_DEBUG=true
   ```

4. **Start the app:**
   ```bash
   pnpm install
   pnpm dev:all
   ```

5. **Open browser:**
   ```
   http://localhost:3000
   ```

6. **Open Console (F12) and paste:**
   ```javascript
   throw new Error('🔥 Test error from new machine');
   ```

7. **Check Sentry Dashboard (10-30 seconds):**
   ```
   https://sentry.io/organizations/o4510817971077120/issues/?project=4510818071740496
   ```

### Expected Result

You should see:
- ✅ New issue in Sentry dashboard
- ✅ Error message: "🔥 Test error from new machine"
- ✅ Stack trace with line numbers
- ✅ Browser/environment info

### If It Works

Sentry is fully operational! You can:
1. Remove test error trigger
2. Disable SENTRY_DEBUG for production (keeps dev clean)
3. Configure alerts in Sentry dashboard
4. Optionally add source maps (SENTRY_AUTH_TOKEN)

### Network Requirements

Sentry needs outbound HTTPS access to:
- `ingest.de.sentry.io` (German region)
- Port 443

**Blocked by:**
- Ad blockers (uBlock, AdBlock)
- Privacy extensions
- Corporate firewalls
- VPN with ad blocking

**Whitelist if needed:**
- `*.sentry.io`
- `*.ingest.de.sentry.io`

## Current Machine Workaround

To test on current blocked machine:

1. **Disable ad blocker temporarily**
2. **Or whitelist Sentry:**
   - Add `*.sentry.io` to exceptions
3. **Or test in Incognito Mode** (extensions usually disabled)

## Alternative: Test on Deployed Environment

If local testing remains blocked:
1. Deploy to staging/production
2. Trigger error on deployed site
3. Sentry will capture it (no local network blocking)

## Documentation

Full setup guide: `docs/SENTRY_SETUP.md`

## Commits Related to Sentry

```
b89beee - chore: remove Sentry test endpoint after successful verification
8f9d459 - fix: resolve critical issues from oathkeeper review
140252f - feat: add Sentry error tracking and monitoring
```

---

**Last Updated:** 2026-02-02
**Status:** Configured, network-blocked on current machine
**Action Required:** Test on machine without network blocking
