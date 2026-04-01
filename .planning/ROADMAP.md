# Roadmap: Interactive Knowledge Graph

## Overview

This roadmap transforms PlayPatch from a video platform into a visual learning journey. Children explore topics through interactive force-directed graphs instead of search or browse. Parents see their child's interests mapped visually to guide content imports and real-world purchases. The four-phase journey starts with data infrastructure and AI entity extraction, builds the interactive visualization with age-appropriate modes, and completes with advanced discovery features and parent insights.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Pipeline** - Graph database schema, caching infrastructure, API endpoints
- [x] **Phase 2: AI Integration & Entity Quality** - Entity extraction with OpenAI, fuzzy matching, specificity filtering
- [ ] **Phase 3: Interactive Visualization & Age Modes** - Force-directed graph with Explorer and Toddler modes
- [ ] **Phase 4: Advanced Features & Parent Insights** - Entry points, parent dashboard, discovery enhancements

## Phase Details

### Phase 1: Foundation & Data Pipeline

**Goal**: Database and API infrastructure exists for storing and querying graph nodes and edges with child-scoped isolation and sub-10ms response times.

**Depends on**: Nothing (first phase)

**Requirements**: PERF-01, PERF-02, PERF-03

**Success Criteria** (what must be TRUE):

1. GraphNode and GraphEdge tables exist in PostgreSQL with Prisma models and child-scoped indexes
2. Redis cache returns graph queries in <10ms with child-prefixed keys and 1-hour TTL
3. BullMQ job processes watch history asynchronously and updates graph structure without blocking user interactions
4. API endpoints serve graph data with child isolation enforced at database query level

**Plans**: 5 plans in 4 waves

Plans:

- [x] 01-01-PLAN.md — Graph schema and child isolation middleware
- [x] 01-02-PLAN.md — Cache service and graph queries
- [x] 01-03-PLAN.md — BullMQ graph builder job
- [x] 01-04-PLAN.md — Graph API endpoints
- [x] 01-05-PLAN.md — Gap closure: Add GraphNode unique constraint for upsert

### Phase 2: AI Integration & Entity Quality

**Goal**: AI extracts specific, meaningful topics from videos and builds weighted connections that create discoverable relationships instead of meaningless hairball graphs.

**Depends on**: Phase 1

**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06

**Success Criteria** (what must be TRUE):

1. OpenAI structured outputs extract 3-5 topics per video with 100% schema adherence using Zod validation
2. Fuzzy matching deduplicates similar entities at 92% similarity threshold (e.g., "ocean animals" matches "marine creatures")
3. TF-IDF specificity scoring filters out generic terms like "fun" and "learning" to keep meaningful topics only
4. Graph contains weighted edges based on topic co-appearance, shared categories, and watch sequence patterns
5. Edge weight thresholds prune weak connections (<0.3) to prevent over-connected hairball visualization

**Plans**: 3 plans in 2 waves

Plans:

- [x] 02-01-PLAN.md — AI dependencies and topic extraction with OpenAI structured outputs
- [x] 02-02-PLAN.md — Fuzzy entity matching and TF-IDF specificity filtering
- [x] 02-03-PLAN.md — Edge weighting enhancement and topic extraction worker integration

### Phase 3: Interactive Visualization & Age Modes

**Goal**: Children can explore force-directed topic graphs through age-appropriate interfaces - Explorer mode with 50-100 nodes for ages 5-12, Toddler mode with 5-8 large bubbles for ages 2-4.

**Depends on**: Phase 2

**Requirements**: GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05, GRAPH-06, GRAPH-07, GRAPH-08, GRAPH-09, MODE-01, MODE-02, MODE-03, MODE-04

**Success Criteria** (what must be TRUE):

1. Child sees interactive force-directed graph with zoom (pinch/wheel), pan (drag), and reset view controls
2. Child clicks topic node to select it, sees bright border highlight, connected nodes dim, related videos appear in sidebar
3. Watched topics display in dim colors, unwatched topics display in bright colors for visual distinction
4. Explorer mode (ages 5-12) shows 50-100 nodes with category filter dropdown and all interaction features
5. Toddler mode (ages 2-4) shows 5-8 large colorful bubbles with tap-only interaction, 60px+ touch targets, progressive disclosure (tap → zoom → sub-topics → video)
6. Graph displays clustered layout with related topics visually grouped together instead of random scatter

**Plans**: TBD

Plans:

- [ ] 03-01: TBD during phase planning

### Phase 4: Advanced Features & Parent Insights

**Goal**: Parents see actionable insights about child interests and children discover content through contextual graph entry points from watch page and home screen.

**Depends on**: Phase 3

**Requirements**: ENTRY-01, ENTRY-02, ENTRY-03, PARENT-01, PARENT-02, PARENT-03, PARENT-04

**Success Criteria** (what must be TRUE):

1. Video watch page shows "Explore Topics" button that opens graph centered on current video's topics
2. Child home screen shows "My Learning Map" card that opens full child-scoped graph
3. Clicking topic node shows sidebar with 3-5 related unwatched videos sorted by relevance
4. Parent dashboard displays top 5-10 topics by total watch time with deep vs shallow engagement indicators
5. Parent dashboard highlights topics child explored but has few videos for (content gap identification for imports)
6. Parent can click topic to see list of videos watched in that category with timestamps

**Plans**: TBD

Plans:

- [ ] 04-01: TBD during phase planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase                                    | Plans Complete | Status      | Completed  |
| ---------------------------------------- | -------------- | ----------- | ---------- |
| 1. Foundation & Data Pipeline            | 5/5            | ✓ Complete  | 2026-02-03 |
| 2. AI Integration & Entity Quality       | 3/3            | ✓ Complete  | 2026-02-03 |
| 3. Interactive Visualization & Age Modes | 0/TBD          | Not started | -          |
| 4. Advanced Features & Parent Insights   | 0/TBD          | Not started | -          |
