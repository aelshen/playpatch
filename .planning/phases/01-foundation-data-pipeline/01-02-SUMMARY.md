---
phase: 01-foundation-data-pipeline
plan: 02
subsystem: data-access
tags: [redis, cache, graph-queries, typescript, prisma]

# Dependency graph
requires:
  - phase: 01-foundation-data-pipeline
    plan: 01
    provides: GraphNode, GraphEdge, GraphNodeVideo models and child-scoped middleware
provides:
  - Typed graph data structures for React Force Graph 2D
  - Redis cache service with <10ms target and 1-hour TTL
  - Database query functions for all 4 graph types
  - Child-prefixed cache keys for isolation
affects: [01-03-graph-builder, 01-04-api-endpoints, visualization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Redis caching with child-scoped keys
    - Transform functions for database to visualization format
    - Graceful degradation on cache/query errors

key-files:
  created:
    - apps/web/src/lib/graph/types.ts
    - apps/web/src/lib/graph/cache.ts
    - apps/web/src/lib/db/queries/graph.ts
  modified:
    - apps/web/src/lib/db/queries/index.ts

key-decisions:
  - 'Cache keys use child-prefix pattern (graph:child:[id]:*) for efficient invalidation'
  - 'Transform functions convert DB format to React Force Graph 2D format (nodes/edges arrays)'
  - 'Log scale for node size visualization (val = log10(totalWatchTime + 1) * 10)'
  - 'Weak edges pruned at 0.3 weight threshold for cleaner full graph'
  - 'Depth parameter in neighborhood query reserved for future multi-hop expansion'

patterns-established:
  - 'GraphResponse type with nodes[], edges[], meta for all query responses'
  - 'Cache service logs warnings when >10ms but never throws errors'
  - 'Database queries return empty graphs on error (graceful degradation)'
  - 'All queries include childId in WHERE clauses for middleware validation'

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 01 Plan 02: Graph Queries & Cache Summary

**Redis cache service and typed database queries for graph visualization with <10ms response target**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-03T21:32:50Z
- **Completed:** 2026-02-03T21:36:38Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- TypeScript type definitions for graph nodes, edges, responses, and cache keys
- Redis cache service with 1-hour TTL and child-prefixed keys
- Database query functions for all 4 graph types (full, video, category, neighborhood)
- Transform functions convert Prisma output to React Force Graph 2D format
- Graceful error handling ensures cache/query failures don't break UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Create graph type definitions** - `eac3fc8` (feat)
2. **Task 2: Create graph cache service** - `a88bb93` (feat)
3. **Task 3: Create graph database queries** - `6bfa88b` (feat)

## Files Created/Modified

### Created

- `apps/web/src/lib/graph/types.ts` - TypeScript types for graph data structures
- `apps/web/src/lib/graph/cache.ts` - Redis cache service with <10ms target
- `apps/web/src/lib/db/queries/graph.ts` - Database query functions for all 4 graph types

### Modified

- `apps/web/src/lib/db/queries/index.ts` - Export graph query functions

## Decisions Made

**1. Child-prefixed cache key pattern**

- Cache keys follow `graph:child:[id]:[type]:[param]` pattern
- Enables efficient pattern-based invalidation with `graph:child:*` wildcard
- Isolates cache entries per child for data safety
- Rationale: Matches cache isolation best practices, supports both bulk and targeted invalidation

**2. Log scale for node size visualization**

- Node size calculated as `Math.max(1, Math.log10(totalWatchTime + 1) * 10)`
- Prevents extreme size differences between popular and unpopular topics
- Rationale: Linear watch time would create massive outlier nodes; log scale keeps graph readable

**3. Transform functions for visualization format**

- `toVisualizationNode()` and `toVisualizationEdge()` convert DB format to React Force Graph 2D
- Flattens nested Prisma relations into simple objects
- Rationale: Decouples database schema from frontend expectations, enables schema changes without UI breakage

**4. Weak edge pruning in full graph**

- Full graph query filters `weight >= 0.3` to prune weak edges
- Other query types include all edges (user-selected context)
- Rationale: Reduces visual clutter in full graph while preserving detail in targeted views

**5. Depth parameter reserved for future**

- `getTopicNeighborhood` accepts depth parameter but currently only implements 1-hop
- Prefixed with `_depth` to satisfy linter (unused var)
- Rationale: API design for future multi-hop expansion without breaking changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Removed unused Prisma type imports**

- **Found during:** Task 1 commit (ESLint pre-commit hook)
- **Issue:** `@typescript-eslint/no-unused-vars` error for unused imports from `@prisma/client`
- **Fix:** Removed `import type { GraphNode, GraphEdge, GraphNodeVideo, Video }` line since types are self-contained
- **Files modified:** apps/web/src/lib/graph/types.ts
- **Verification:** ESLint passed, types still compile correctly
- **Committed in:** eac3fc8 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Fixed no-case-declarations ESLint error**

- **Found during:** Task 2 commit (ESLint pre-commit hook)
- **Issue:** `no-case-declarations` error in switch statement (const in case block)
- **Fix:** Wrapped `case 'full':` block with braces to scope the const declaration
- **Files modified:** apps/web/src/lib/graph/cache.ts
- **Verification:** ESLint passed
- **Committed in:** a88bb93 (Task 2 commit)

**3. [Rule 2 - Missing Critical] Prefixed unused depth parameter**

- **Found during:** Task 3 commit (ESLint pre-commit hook)
- **Issue:** `@typescript-eslint/no-unused-vars` error for `depth` parameter in `getTopicNeighborhood`
- **Fix:** Renamed to `_depth` to indicate intentionally unused (reserved for future multi-hop queries)
- **Files modified:** apps/web/src/lib/db/queries/graph.ts
- **Verification:** ESLint passed, parameter preserved in function signature
- **Committed in:** 6bfa88b (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (all linting fixes for successful commits)
**Impact on plan:** All fixes were linting corrections required by pre-commit hooks. No scope creep.

## Issues Encountered

**TypeScript path alias resolution in isolated file checks**

- `npx tsc --noEmit` on single files can't resolve `@/lib/*` path aliases
- Resolution: Verified files exist and path aliases configured in tsconfig.json
- Impact: None - Next.js build will resolve paths correctly, this is a tsc CLI limitation

## User Setup Required

None - uses existing Redis client and Prisma client infrastructure.

## Next Phase Readiness

**Ready for Phase 01 Plan 03 (Graph builder):**

- Type definitions ready for graph builder to use
- Database query functions ready to test with sample data
- Cache service ready for graph builder to populate after entity extraction

**Ready for Phase 01 Plan 04 (API endpoints):**

- Query functions can be called directly from API routes
- Cache service provides `getGraphFromCache` and `setGraphInCache` for cache-aside pattern
- `invalidateGraphCache` ready for use when watch sessions complete

**Ready for Phase 03 (Visualization):**

- GraphResponse format matches React Force Graph 2D expectations (nodes/edges arrays)
- Node `val` property for size, `source`/`target` for edges
- Transform functions ensure consistent format regardless of query type

**No blockers identified.**

---

_Phase: 01-foundation-data-pipeline_
_Completed: 2026-02-03_
