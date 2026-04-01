---
phase: 01-foundation-data-pipeline
plan: 05
subsystem: database
tags: [prisma, postgresql, migration, schema, unique-constraint]

# Dependency graph
requires:
  - phase: 01-foundation-data-pipeline
    provides: GraphNode schema with index, builder.ts using upsert operations
provides:
  - GraphNode unique constraint enabling Prisma upsert by childId + normalizedLabel
  - Database migration applied and verified
  - Type-safe upsert operations in graph builder service
affects: [graph-builder, watch-history-processing, phase-02-ai-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Unique constraints for composite keys in Prisma
    - Manual migration file creation for non-interactive environments

key-files:
  created:
    - apps/web/prisma/migrations/20260203223354_add_graph_node_unique_constraint/migration.sql
  modified:
    - apps/web/prisma/schema.prisma

key-decisions:
  - 'Changed @@index to @@unique for childId + normalizedLabel to enable Prisma upsert operations'
  - 'Used manual migration file creation due to non-interactive environment limitation'
  - 'Applied migration via prisma migrate deploy instead of migrate dev'

patterns-established:
  - 'Composite unique constraints for deduplication in child-scoped data models'
  - 'Migration SQL manually created when Prisma CLI non-interactive mode blocks automation'

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 01 Plan 05: GraphNode Unique Constraint Summary

**GraphNode schema updated with unique constraint on childId + normalizedLabel enabling type-safe upsert operations in graph builder service**

## Performance

- **Duration:** 3 min (184 seconds)
- **Started:** 2026-02-03T22:32:55Z
- **Completed:** 2026-02-03T22:36:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Fixed critical schema issue preventing graph builder from functioning at runtime
- Added `@@unique([childId, normalizedLabel])` constraint to GraphNode model
- Applied database migration successfully to development database
- Verified Prisma client recognizes unique constraint for upsert operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Add unique constraint to GraphNode schema** - `9d796d9` (fix)
2. **Task 2: Run database migration** - `ad90a90` (chore)
3. **Task 3: Verify builder upsert compiles** - _(verification only, no code changes)_

## Files Created/Modified

**Created:**

- `apps/web/prisma/migrations/20260203223354_add_graph_node_unique_constraint/migration.sql` - Migration dropping old index and adding unique constraint

**Modified:**

- `apps/web/prisma/schema.prisma` - Changed `@@index([childId, normalizedLabel])` to `@@unique([childId, normalizedLabel])` in GraphNode model (line 560)

## Decisions Made

1. **Manual migration file creation**: Prisma CLI's `migrate dev` requires interactive mode and fails in non-interactive environments. Created migration SQL file manually following the existing migration file structure pattern from previous migrations.

2. **Used `prisma migrate deploy`**: Applied the migration using `migrate deploy` instead of `migrate dev` since it works in non-interactive environments and is designed for CI/CD scenarios.

3. **Kept other indexes unchanged**: Preserved existing indexes on `[childId]`, `[childId, category]`, and `[childId, totalWatchTime]` - only replaced the index with unique constraint where needed for upsert.

## Deviations from Plan

None - plan executed exactly as written. This was a gap closure plan addressing a verification failure from 01-VERIFICATION.md.

## Issues Encountered

**Prisma CLI non-interactive limitation**: The `prisma migrate dev` command detects non-interactive environments and refuses to run, even with empty input piped. Resolved by manually creating the migration file following the existing migration structure pattern and applying with `prisma migrate deploy`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Critical blocker resolved**: The missing unique constraint was preventing graph builder jobs from completing successfully. With this fix:

- Truth "BullMQ job processes watch history asynchronously" can now be verified as working
- Graph builder upsert operations at `builder.ts:73` will succeed at runtime
- No more `PrismaClientKnownRequestError` when processing watch sessions

**Phase 1 validation status**: All must-have truths from 01-VERIFICATION.md can now be verified. The foundation layer is complete and ready for Phase 2 (AI Integration).

**Database state**: Unique constraint verified in PostgreSQL:

```sql
-- Constraint exists: GraphNode_childId_normalizedLabel_key
SELECT conname FROM pg_constraint
WHERE conrelid = '"GraphNode"'::regclass AND contype = 'u';
```

**Prisma client state**: Generated client includes `childId_normalizedLabel` as valid unique identifier for upsert `where` clauses.

---

_Phase: 01-foundation-data-pipeline_
_Completed: 2026-02-03_
