---
phase: 02-ai-integration-entity-quality
plan: 03
subsystem: ai-pipeline
tags: [bullmq, openai, graph-builder, topic-extraction, fuzzy-matching, worker]

# Dependency graph
requires:
  - phase: 02-01
    provides: OpenAI structured topic extraction with VideoTopicsSchema
  - phase: 02-02
    provides: Entity matcher (fuzzy dedup), specificity filter
  - phase: 01-03
    provides: GraphNode, GraphEdge database schema with unique constraints
provides:
  - Topic extraction BullMQ worker with rate limiting (10/min)
  - processVideoWithAI pipeline (extract → filter → dedupe → match → graph)
  - updateSequenceEdges for AI-06 watch sequence edge weighting
  - Automated topic extraction triggered after video download
  - Category bonus (0.1) and sequence bonus (0.05-0.3) in edge weights
affects: [video-processing, graph-api, recommendation-engine]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'BullMQ worker for AI processing with concurrency 2 and rate limiting'
    - 'Full AI pipeline integration: extraction → filtering → deduplication → matching → graph building'
    - 'Edge weight components: coAppearance + category + sequence (sum capped at 1.0)'
    - 'Job deduplication by videoId prevents duplicate AI extractions'

key-files:
  created:
    - apps/web/src/workers/topic-extraction.ts
  modified:
    - apps/web/src/lib/queue/client.ts
    - apps/web/src/lib/graph/builder.ts
    - apps/web/src/workers/index.ts
    - apps/web/src/workers/video-download.ts

key-decisions:
  - 'Rate limit topic extraction to 10/min with concurrency 2 to prevent OpenAI quota exhaustion'
  - 'Process all children in family when extracting topics for a video (family-scoped graph)'
  - 'Use 2 retry attempts for AI jobs (fewer than default 3) since AI failures often need investigation'
  - 'Add 2-second delay before topic extraction to let video metadata settle'
  - 'Category bonus of 0.1 applied only once per edge (not cumulative)'
  - 'Sequence bonus ranges from 0.05-0.3 with diminishing returns'

patterns-established:
  - 'AI worker pattern: rate-limited, low retry count, detailed logging for monitoring'
  - 'Graph builder uses AI extraction if video.topics is empty, otherwise uses existing'
  - 'Fuzzy matching with 92% threshold using token_set_ratio for topic deduplication'
  - 'Generic topics filtered before graph processing to maintain quality'

# Metrics
duration: 5min
completed: 2026-02-03
---

# Phase 02 Plan 03: AI Pipeline Integration Summary

**BullMQ worker triggers topic extraction after video download, with full AI pipeline (extract → filter → dedupe → match) building quality graph edges with category and sequence bonuses**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-04T02:35:54Z
- **Completed:** 2026-02-04T02:40:46Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Topic extraction worker processes videos automatically after download completes
- processVideoWithAI integrates all AI components into complete pipeline
- Edge weights enhanced with category bonus (AI-05) and sequence bonus (AI-06)
- Rate limiting prevents OpenAI API quota exhaustion
- Linting cleanup in video-download.ts for TypeScript compliance

## Task Commits

Each task was committed atomically:

1. **Task 1: Add topic extraction queue and job helper** - `c520267` (feat)
2. **Task 2: Enhance graph builder with AI integration and sequence edges** - `2730567` (feat)
3. **Task 3: Create topic extraction worker and wire to video pipeline** - `f850e26` (feat)

## Files Created/Modified

- `apps/web/src/lib/queue/client.ts` - Added TOPIC_EXTRACTION queue, TopicExtractionJobData interface, addTopicExtractionJob helper
- `apps/web/src/lib/graph/builder.ts` - Added processVideoWithAI (full AI pipeline), updateSequenceEdges (AI-06 sequence weighting)
- `apps/web/src/workers/topic-extraction.ts` - NEW: BullMQ worker for AI topic extraction with rate limiting
- `apps/web/src/workers/index.ts` - Registered topicExtractionWorker with graceful shutdown
- `apps/web/src/workers/video-download.ts` - Triggers addTopicExtractionJob after transcode queuing, linting fixes

## Decisions Made

**Rate limiting strategy:**

- Chose 10 jobs/min and concurrency 2 to balance throughput with OpenAI rate limits
- Reduced retry attempts to 2 (vs default 3) since AI failures often require investigation rather than blind retries

**Pipeline behavior:**

- processVideoWithAI checks for existing topics first - only calls OpenAI if video.topics is empty
- Processes all children in family (not just one child) for family-scoped graph building
- Updates video.categories with AI-extracted category if video has no categories

**Edge weight components:**

- Category bonus (0.1) applied only once per edge, not cumulative
- Sequence bonus uses diminishing returns (0.05 increment, max 0.3)
- Total weight capped at 1.0 across all components

**Job deduplication:**

- JobId format `topic-extract:${videoId}` prevents duplicate extractions
- 2-second delay before processing lets video metadata settle

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript linting errors in video-download.ts**

- **Found during:** Task 3 (Pre-commit hook)
- **Issue:** Unused imports (exec, promisify, uploadFile, DownloadError), any type annotations, require() usage blocking commit
- **Fix:** Removed unused imports, added proper type annotations, replaced require('fs') with dynamic import fs/promises
- **Files modified:** apps/web/src/workers/video-download.ts
- **Verification:** Pre-commit hook passes, TypeScript linting clean
- **Committed in:** f850e26 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug - linting compliance)
**Impact on plan:** Linting fix was necessary for code quality and CI/CD pipeline. No scope creep.

## Issues Encountered

None - plan executed smoothly with AI components integrating as designed.

## User Setup Required

None - worker uses existing OPENAI_API_KEY and REDIS_URL environment variables already configured in phase 02-01.

**Worker startup:** Topic extraction worker starts automatically when `npm run workers` is executed (already registered in workers/index.ts).

## Next Phase Readiness

**Ready for:**

- Phase 03 (if exists): Video ingestion will automatically trigger AI extraction and graph building
- Manual testing: Can test with `addTopicExtractionJob({ videoId, familyId, trigger: 'manual_rebuild' })`
- Production: Worker is rate-limited and retry-configured for production use

**Quality checks:**

- Topic extraction respects specificity filter (generic topics removed)
- Fuzzy matching deduplicates similar topics (92% threshold)
- Edge weights properly balanced with category and sequence bonuses

**No blockers:** All dependencies met, worker ready to process videos.

---

_Phase: 02-ai-integration-entity-quality_
_Completed: 2026-02-03_
