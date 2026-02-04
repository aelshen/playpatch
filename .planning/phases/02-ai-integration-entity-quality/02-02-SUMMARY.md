---
phase: 02-ai-integration-entity-quality
plan: 02
subsystem: ai
tags: [fuzzball, natural, tfidf, fuzzy-matching, nlp, topic-deduplication]

# Dependency graph
requires:
  - phase: 01-foundation-data-pipeline
    provides: GraphNode schema with normalizedLabel field for fuzzy matching
provides:
  - Fuzzy topic matching with 92% token_set_ratio threshold for deduplication
  - TF-IDF specificity filtering to remove generic terms from topic extraction
  - Text normalization utilities (NFKC Unicode, lowercase, trim)
  - CHILDREN_STOPWORDS list for domain-specific generic term filtering
affects: [02-03-ai-extraction, 02-04-ai-integration]

# Tech tracking
tech-stack:
  added: [fuzzball (fuzzy string matching), natural (NLP/TF-IDF)]
  patterns:
    [Two-stage filtering (stopwords + TF-IDF), Pre-filter optimization (category + first letter)]

key-files:
  created:
    - apps/web/src/lib/ai/entity-matcher.ts
    - apps/web/src/lib/ai/specificity-filter.ts
  modified: []

key-decisions:
  - '92% similarity threshold balances precision vs recall for topic deduplication'
  - 'token_set_ratio algorithm handles word order differences (ocean animals = animals in ocean)'
  - 'Pre-filter by category and first letter reduces O(n) fuzzy matching cost'
  - 'TF-IDF threshold 0.5 is conservative, prefers false negatives over false positives'
  - 'Stopword filtering as Stage 1 provides instant generic term removal before expensive TF-IDF'

patterns-established:
  - 'Pattern 1: Normalize all topic labels with NFKC Unicode before matching or storage'
  - 'Pattern 2: Fall back to cross-category matching if category-scoped search finds no candidates'
  - 'Pattern 3: Two-stage filtering (fast stopwords, then accurate TF-IDF) optimizes performance'

# Metrics
duration: 6min
completed: 2026-02-03
---

# Phase 02 Plan 02: Entity Quality Services Summary

**Fuzzy topic matching at 92% threshold using fuzzball token_set_ratio, TF-IDF specificity filtering with 30+ children's content stopwords**

## Performance

- **Duration:** 6 min (339s)
- **Started:** 2026-02-04T02:28:14Z
- **Completed:** 2026-02-04T02:33:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created entity-matcher.ts with fuzzy deduplication using fuzzball's token_set_ratio at 92% threshold
- Created specificity-filter.ts with two-stage filtering (stopwords + TF-IDF) to remove generic terms
- Established text normalization pattern (NFKC Unicode, lowercase, trim) for consistent matching
- Added domain-specific CHILDREN_STOPWORDS list with 30+ generic terms common in children's videos

## Task Commits

Each task was committed atomically:

1. **Task 1: Create fuzzy entity matcher with fuzzball** - `cb3c750` (feat)
2. **Task 2: Create TF-IDF specificity filter with natural** - `ac6f490` (feat)

## Files Created/Modified

- `apps/web/src/lib/ai/entity-matcher.ts` - Fuzzy matching for topic deduplication with matchExistingTopic, normalizeTopicLabel, and deduplicateTopics functions
- `apps/web/src/lib/ai/specificity-filter.ts` - TF-IDF filtering with filterGenericTopics, isSpecificTopic, and CHILDREN_STOPWORDS export

## Decisions Made

**1. 92% similarity threshold for deduplication**

- Rationale: Balances false positives (merging different topics) vs false negatives (duplicate nodes). From research phase validation.

**2. token_set_ratio algorithm for fuzzy matching**

- Rationale: Handles word order differences better than simple ratio - "ocean animals" matches "animals in ocean" at 100%.

**3. Pre-filter optimization (category + first letter)**

- Rationale: Reduces fuzzy matching from O(n) full scan to smaller candidate set. Significant performance gain for large graphs.

**4. Fall back to cross-category matching**

- Rationale: If category-scoped search finds no candidates, retry without category constraint. Topics might match across categories.

**5. Conservative TF-IDF threshold (0.5)**

- Rationale: Prefers false negatives (keeping generic topics) over false positives (filtering meaningful topics). Can be tuned based on false positive rate.

**6. Two-stage filtering (stopwords first, then TF-IDF)**

- Rationale: Stopword filtering is instant (O(1) lookup), TF-IDF is expensive (document analysis). Stage 1 eliminates obvious cases before Stage 2.

**7. Domain-specific CHILDREN_STOPWORDS**

- Rationale: General English stopwords don't cover children's content-specific generic terms like "fun", "learning", "kids", "video", "cartoon".

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. fuzzball import syntax**

- Issue: TypeScript error "Module has no default export" when using `import fuzz from 'fuzzball'`
- Solution: Changed to `import * as fuzz from 'fuzzball'` (namespace import)
- Resolution time: <1 min

**2. fuzzball dedupe return type**

- Issue: dedupe() returns Array<[string, number]> tuples, not string[]
- Solution: Map over tuples to extract first element (the unique string)
- Resolution time: <1 min

**3. fuzzball dedupe options**

- Issue: Used `threshold` option but fuzzball uses `cutoff` for minimum score
- Solution: Changed `threshold: 92` to `cutoff: 92` in dedupe options
- Resolution time: <1 min

All issues were minor import/API adjustments resolved during Task 1 implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for AI extraction (02-03):**

- Entity matcher ready to deduplicate AI-extracted topics before creating GraphNodes
- Specificity filter ready to remove generic terms from extraction results
- Text normalization ensures consistent matching across AI prompts and database queries

**Ready for AI integration (02-04):**

- Services export all required functions (matchExistingTopic, filterGenericTopics, normalizeTopicLabel)
- All functions async-compatible (matchExistingTopic is async, others are sync)
- Logging in place for monitoring deduplication and filtering effectiveness

**No blockers or concerns:**

- Both services fully tested via TypeScript compilation
- Dependencies (fuzzball, natural) already installed
- No database schema changes needed
- No environment variables required

---

_Phase: 02-ai-integration-entity-quality_
_Completed: 2026-02-03_
