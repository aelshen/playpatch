---
phase: 01-foundation-data-pipeline
plan: 03
subsystem: background-jobs
tags: [bullmq, queue, graph-builder, async-processing, redis]

# Dependency graph
requires:
  - phase: 01-foundation-data-pipeline
    plan: 01
    provides: GraphNode, GraphEdge, GraphNodeVideo database models
provides:
  - Graph builder queue and job helper (addGraphBuildJob)
  - Graph building service with incremental and full rebuild logic
  - BullMQ worker for async graph processing
  - Automatic cache invalidation after graph updates
affects: [01-04-graph-api, watch-session-completion-hooks]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Async job processing with BullMQ for compute-intensive operations
    - Job deduplication using jobId to prevent rapid-fire updates
    - Incremental vs full rebuild strategy for graph updates
    - Worker concurrency and rate limiting for resource control

key-files:
  created:
    - apps/web/src/lib/queue/client.ts (GRAPH_BUILD queue)
    - apps/web/src/lib/graph/builder.ts
    - apps/web/src/workers/graph-builder.ts
  modified:
    - apps/web/src/lib/queue/client.ts
    - apps/web/src/workers/index.ts

key-decisions:
  - 'Job deduplication with 5-second delay prevents rapid-fire updates during quick video switches'
  - '2 retry attempts with exponential backoff for graph builds (less aggressive than other jobs)'
  - 'Worker concurrency: 2, rate limit: 10/minute to prevent database overload'
  - 'Incremental updates process single watch session, full rebuild processes all sessions'
  - 'Edge weight starts at 0.3 for co-appearance, increments by 0.1 on each re-occurrence'

patterns-established:
  - 'addGraphBuildJob accepts fullRebuild flag for rebuild type selection'
  - 'BuildResult interface tracks nodesCreated, nodesUpdated, edgesCreated, edgesUpdated, duration'
  - 'updateGraphFromWatchSession: processes video topics, creates/updates nodes, creates edges for co-appearing topics'
  - 'buildGraphForChild: deletes existing graph, processes all watch sessions from scratch'
  - 'Cache invalidation called automatically after all graph updates'

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 01 Plan 03: Graph Building Worker Summary

**BullMQ job and worker for asynchronous graph building from watch history with 5-10 second off-critical-path processing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-03T21:39:24Z
- **Completed:** 2026-02-03T21:42:44Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Graph builder queue created with job deduplication and 5-second delay
- Graph building service with incremental update (single video) and full rebuild (all sessions) logic
- BullMQ worker processes graph build jobs with concurrency=2 and rate limiting (10/minute)
- Automatic cache invalidation after graph updates ensures cache consistency
- Worker registered in workers/index.ts with graceful shutdown handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Add graph builder queue** - `03c4137` (feat)
2. **Task 2: Create graph builder service** - `27cc45b` (feat)
3. **Task 3: Create graph builder worker and register** - `9463cdc` (feat)

## Files Created/Modified

- `apps/web/src/lib/queue/client.ts` - Added GRAPH_BUILD queue, graphBuilderQueue, addGraphBuildJob helper
- `apps/web/src/lib/graph/builder.ts` - Graph building logic with updateGraphFromWatchSession and buildGraphForChild
- `apps/web/src/workers/graph-builder.ts` - BullMQ worker that processes graph build jobs
- `apps/web/src/workers/index.ts` - Registered graphBuilderWorker with graceful shutdown

## Decisions Made

**1. Job deduplication with 5-second delay**

- Jobs use `jobId: graph-build:${childId}:${full|incremental}` for deduplication
- 5-second delay prevents rapid-fire updates when child switches videos quickly
- Rationale: Graph building is compute-intensive; batching updates within 5s window improves efficiency

**2. Worker concurrency and rate limiting**

- Concurrency: 2 (allow 2 concurrent graph builds)
- Rate limit: 10 jobs per minute
- Rationale: Prevents database overload from multiple children watching simultaneously

**3. Edge weight calculation strategy**

- Base weight: 0.3 for initial co-appearance
- Increment: 0.1 for each additional co-appearance
- Cap: 1.0 maximum weight
- Metadata tracks videoIds, timestamps, and weight components (coAppearance, category, sequence)
- Rationale: Weight represents topic relationship strength; incremental growth from repeated co-appearance

**4. Incremental vs full rebuild**

- Incremental: processes single watch session, faster (typically 1-3 seconds)
- Full rebuild: deletes graph and processes all watch sessions from scratch (5-10+ seconds)
- Rationale: Incremental for normal flow, full rebuild for data corrections or migrations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All tasks completed successfully without blockers.

## User Setup Required

None - worker starts automatically when workers process starts. Queue and job helper ready for use by watch session completion hooks.

## Next Phase Readiness

**Ready for Phase 01 Plan 04 (Graph API endpoints):**

- addGraphBuildJob ready to be called from watch session completion hooks
- Graph data populated asynchronously in background
- Cache invalidated automatically after updates
- BuildResult metrics available for monitoring

**Integration points for future work:**

- Watch session completion should call: `await addGraphBuildJob({ childId, videoId, watchSessionId, fullRebuild: false })`
- Admin rebuild endpoint can call: `await addGraphBuildJob({ childId, videoId: '', watchSessionId: '', fullRebuild: true })`

**No blockers identified.**

---

_Phase: 01-foundation-data-pipeline_
_Completed: 2026-02-03_
