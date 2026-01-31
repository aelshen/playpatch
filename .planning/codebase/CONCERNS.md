# Codebase Concerns

**Analysis Date:** 2026-01-22

## Tech Debt

**Large Components - Complexity & Maintainability:**
- Issue: Component `video-detail-view.tsx` is 640 lines with 10+ useState hooks and 4+ useEffect hooks, violating Single Responsibility Principle
- Files: `apps/web/src/components/admin/video-detail-view.tsx`
- Impact: Difficult to test, hard to modify, performance concerns with excessive re-renders, prone to bugs during refactoring
- Fix approach: Split into focused sub-components (VideoPreview, VideoMetadata, VideoStatusAlert, ApprovalForm, VideoActions) and extract hooks (useVideoPolling, useVideoActions)

**Type Safety Violations - 144+ Instances:**
- Issue: Widespread use of `as any` type casts and missing type annotations across codebase
- Files:
  - `apps/web/src/lib/db/queries/videos.ts` (12+ instances)
  - `apps/web/src/lib/db/queries/watch-sessions.ts` (8+ instances)
  - `apps/web/src/lib/actions/videos.ts` (15+ instances)
  - `apps/web/src/components/admin/video-detail-view.tsx` (5+ instances)
  - Additional 144+ instances throughout codebase
- Impact: Loses runtime type safety, IDE autocomplete disabled, harder to refactor, potential runtime errors
- Fix approach: Replace `as any` with proper Prisma enum types (VideoStatus, ApprovalStatus, AgeRating) or use Zod schema validation at API boundaries

**Complex Video Player Hook - 306 Lines:**
- Issue: `use-video-player.ts` manages HLS.js lifecycle, player state, quality selection, and fullscreen in single hook
- Files: `apps/web/src/components/player/use-video-player.ts`
- Impact: Difficult to test individual pieces, high cognitive load, hard to debug HLS issues independently
- Fix approach: Extract focused sub-hooks (useHlsPlayer for HLS.js integration, usePlayerState for play/pause/time, useQualitySelector for quality levels, useFullscreen for fullscreen handling)

**AI Service Complexity - 527 Lines:**
- Issue: `ai/service.ts` handles chat streaming, context management, conversation history, and AI model coordination in single file
- Files: `apps/web/src/lib/ai/service.ts`
- Impact: Difficult to test streaming behavior, hard to modify conversation context logic independently
- Fix approach: Extract AI client separation (ai/client.ts for model communication, ai/chat-service.ts for business logic, ai/context-manager.ts for conversation history)

---

## Known Bugs

**File Deletion Not Guaranteed:**
- Symptoms: Storage files may remain orphaned after video deletion from database
- Files: `apps/web/src/lib/db/queries/videos.ts` (lines 256-302), specifically the deleteVideo function
- Trigger: When deleteVideo is called, database record deletes first, then storage files delete with error catching (no transaction)
- Problem: If storage deletion fails (MinIO/filesystem down, permission issues), video is already deleted from DB, leaving orphaned files permanently
- Workaround: Files will accumulate in storage; cleanup worker can be run manually later
- Better fix: Implement cleanup worker queue job that runs after deletion, or use database transaction with storage deletion confirmation

**Unhandled JSON Parse Errors in Middleware:**
- Symptoms: Invalid child session cookies cause error, but redirect still happens
- Files: `apps/web/src/middleware.ts` (line 23)
- Trigger: Child profile session cookie contains invalid JSON
- Problem: JSON.parse throws, caught in try-catch, but still proceeds to redirect without logging details
- Workaround: Cookie is cleared on error, user redirected to profile selection
- Better fix: Add structured logging and metrics for session parse failures

**Admin Notification Not Implemented:**
- Symptoms: Child requests submitted but admin dashboard not notified
- Files: `apps/web/src/app/api/requests/route.ts` (line 145 - TODO comment)
- Trigger: When child submits a new request via POST /api/requests
- Problem: TODO indicates notification system not implemented; requests sit in DB with no visibility
- Impact: Admins don't know when new requests arrive unless checking dashboard manually
- Fix approach: Implement WebSocket push notification or webhook to notify admin dashboard in real-time

---

## Security Considerations

**Weak Input Validation on Child Session Cookie:**
- Risk: Child session data in cookie (line 88 in auth/session.ts) is parsed without schema validation
- Files: `apps/web/src/lib/auth/session.ts`, `apps/web/src/middleware.ts`
- Current mitigation: Cookie is set by server only (secure), but parsing doesn't validate structure
- Recommendations: Add Zod schema validation for child session object before using any properties

**Missing CSRF Protection on State-Changing APIs:**
- Risk: POST/PUT/DELETE endpoints like /api/requests, /api/watch/[videoId]/progress may be vulnerable to CSRF
- Files: All route handlers in `apps/web/src/app/api/`
- Current mitigation: None detected
- Recommendations: Implement SameSite cookies (already done), but add explicit CSRF token validation for sensitive operations

**Middleware Authentication Disabled (Known Issue):**
- Risk: Admin route protection currently incomplete; only checked via middleware redirect, not enforced at API level
- Files: `apps/web/src/middleware.ts` (comment on line 5-6), `apps/web/src/lib/auth/config.base.ts`
- Current mitigation: Middleware checks child session and redirects, but compromised session could still access APIs
- Note: Code comment indicates NextAuth v5 Edge Runtime issues
- Recommendations: Re-enable full middleware auth once NextAuth issues resolved, add API route-level auth checks

**Console Error Output May Expose Details:**
- Risk: Error messages logged to console in auth/config.ts line 68 and throughout codebase
- Files: `apps/web/src/lib/auth/config.ts`, multiple error handlers
- Current mitigation: Errors caught but message details not sanitized
- Recommendations: Use structured logger with error redaction instead of console.error

---

## Performance Bottlenecks

**Channel Sync Rate Limiting Not Enforced:**
- Problem: syncChannel function has no rate limiting; syncing 100 channels simultaneously hammers YouTube API
- Files: `apps/web/src/lib/sync/channel-sync.ts`
- Cause: Sequential API calls in loop without backoff, getChannelVideoList and getYouTubeVideoInfo can fail under load
- Improvement path: Implement exponential backoff in getChannelVideoList, add concurrency limit (max 3 parallel syncs), use Redis for rate limit tracking

**No Pagination Enforcement on HLS File Deletion:**
- Problem: deleteVideo lists all HLS files in directory and deletes sequentially; large directories (500+ segments) block for seconds
- Files: `apps/web/src/lib/db/queries/videos.ts` (line 276)
- Cause: listFiles returns all files at once, deleteFile called individually in loop
- Improvement path: Add chunked deletion (delete in batches of 50), implement storage backend batch delete operation

**Video Player Quality Selection Has No Caching:**
- Problem: HLS quality levels fetched and evaluated on every manifest parse
- Files: `apps/web/src/components/player/use-video-player.ts` (line 99-135 approximately)
- Cause: Quality manifest parsing happens synchronously in real-time
- Improvement path: Cache quality levels in sessionStorage after first parse, implement network-aware quality default

**Analytics Queries Unoptimized:**
- Problem: ai-analytics.ts (385 lines) queries build large in-memory datasets then filter; no database aggregation
- Files: `apps/web/src/lib/db/queries/ai-analytics.ts`
- Cause: Complex filtering logic done in application layer instead of Prisma aggregation
- Improvement path: Move aggregation to database layer with proper GROUP BY and COUNT operations

---

## Fragile Areas

**Video Download Worker - Cleanup on Failure:**
- Files: `apps/web/src/workers/video-download.ts`
- Why fragile: If download succeeds but transcoding fails, video file exists in storage but queue marked as failed; incomplete cleanup
- Safe modification: Add download job failure handler that triggers cleanup worker, don't rely on manual cleanup
- Test coverage: No tests for partial failure scenarios where file downloaded but not transcoded

**Storage Abstraction - Multiple Implementation Paths:**
- Files: `apps/web/src/lib/storage/interface.ts`, `apps/web/src/lib/storage/client.ts`, `apps/web/src/lib/storage/local.ts`
- Why fragile: Client dynamically selects between MinIO and local storage at runtime; behavior differs between backends
- Safe modification: Always test changes against both backends (docker with MinIO, local filesystem)
- Test coverage: Health checks test storage but not file operation edge cases (permissions, disk full, concurrent writes)

**AI Chat Streaming - Incomplete Chunk Handling:**
- Files: `apps/web/src/components/child/watch/ai-chat-panel.tsx` (line 181), `apps/web/src/lib/ai/client.ts` (line 268)
- Why fragile: JSON.parse errors silently ignored on incomplete chunks; errors assumed to be JSON parse errors not connection errors
- Safe modification: Implement chunk buffer with timeout, differentiate between parse errors and connection timeouts
- Test coverage: No tests for streaming error scenarios or slow network conditions

---

## Scaling Limits

**Redis Session Storage - No Pagination:**
- Current capacity: Single Redis instance supports ~10k concurrent sessions (based on default memory)
- Limit: At ~20k sessions, Redis memory pressure causes eviction
- Scaling path: Implement Redis Sentinel for HA, use Redis cluster for sharding above 50k sessions

**Database Connection Pool - Default Limits:**
- Current capacity: Prisma uses 5 connections by default
- Limit: Under sustained load (50+ concurrent requests), connection pool exhaustion causes cascading delays
- Scaling path: Increase `connection_limit` in .env, use Prisma pooling proxy (PgBouncer) for larger deployments

**Meilisearch Index Rebuild - Single-Threaded:**
- Current capacity: Can index ~1000 videos per minute on single instance
- Limit: Library with 10k+ videos takes 10+ minutes to reindex; blocks search during rebuild
- Scaling path: Split index by family ID, implement incremental indexing instead of full rebuild

---

## Dependencies at Risk

**yt-dlp Vulnerability - System Process:**
- Risk: yt-dlp is spawned as system process in video-download.ts; no sandboxing
- Impact: If yt-dlp has vulnerability, entire application can be compromised
- Migration plan: Consider moving to dedicated download service (separate container), implement process isolation and resource limits

**HLS.js Unmaintained Branch:**
- Risk: HLS.js library may have performance issues with certain streams
- Current usage: `apps/web/src/components/player/use-video-player.ts` relies on HLS.js for adaptive bitrate
- Migration plan: Monitor for adoption of Dash.js or native LL-HLS support in browsers

---

## Missing Critical Features

**Video Deletion Doesn't Delete Search Index:**
- Problem: Deleted video still appears in Meilisearch results
- Blocks: Users can click on video in search that no longer exists
- Files: `apps/web/src/lib/db/queries/videos.ts` (deleteVideo function at line 241)
- Fix: Add call to search/client.ts deleteVideo() function in video deletion workflow

**Rate Limiting on API Endpoints:**
- Problem: No rate limiting on video upload, sync, or download endpoints
- Blocks: Abuse protection; user can spam requests and crash server
- Files: All route handlers in `apps/web/src/app/api/`
- Current implementation: Basic rate limiting exists in cache/client.ts but not applied to endpoints
- Fix: Apply middleware rate limiter to all endpoints using Redis counter (implemented in cache/client.ts line 117)

**Health Check Status Not Cached:**
- Problem: Health check queries all services on every request; high database load
- Blocks: Monitoring systems calling health endpoint 10x/second cause database strain
- Files: `apps/web/src/lib/health/checks.ts`
- Fix: Implement 10-second cache for health check results

---

## Test Coverage Gaps

**Video Download Worker - No Error Scenario Tests:**
- What's not tested: Download failure, file size exceed limit, network timeout, MinIO unreachable
- Files: `apps/web/src/workers/video-download.ts` (no test file)
- Risk: Silent failures not caught until production; orphaned downloads in storage
- Priority: High

**Channel Sync Service - No Rate Limit Tests:**
- What's not tested: Syncing multiple channels simultaneously, YouTube API rate limit response handling
- Files: `apps/web/src/lib/sync/channel-sync.ts` (no test file)
- Risk: Production sync jobs fail silently when rate limited; users don't get new videos
- Priority: High

**AI Safety Filtering - No Edge Case Tests:**
- What's not tested: Empty messages, very long messages (>10k chars), non-ASCII characters, injection attempts
- Files: `packages/ai-safety/src/filters/index.ts`
- Risk: Safety filters bypassed with edge case inputs
- Priority: High

**Video Player Quality Selection - No Network Condition Tests:**
- What's not tested: Slow network (2G/3G), quality switching mid-playback, bandwidth throttling
- Files: `apps/web/src/components/player/use-video-player.ts`
- Risk: Poor user experience on slow networks, buffer underruns not caught
- Priority: Medium

**Child Session Cookie - No Tamper Tests:**
- What's not tested: Invalid session data, missing required fields, extra fields
- Files: `apps/web/src/middleware.ts`, `apps/web/src/lib/auth/session.ts`
- Risk: Malformed session could cause crashes or unexpected behavior
- Priority: Medium

---

*Concerns audit: 2026-01-22*
