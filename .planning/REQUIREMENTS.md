# Requirements - Interactive Knowledge Graph

**Project:** Interactive Knowledge Graph for PlayPatch
**Version:** v1
**Status:** Active Development

## Requirements Overview

| Category              | v1 Count | v2 Count | Total  |
| --------------------- | -------- | -------- | ------ |
| Graph Visualization   | 9        | 0        | 9      |
| Age-Appropriate Modes | 4        | 0        | 4      |
| Data & AI Integration | 6        | 2        | 8      |
| Entry Points          | 3        | 0        | 3      |
| Parent Insights       | 4        | 0        | 4      |
| Performance           | 3        | 0        | 3      |
| **Total**             | **29**   | **2**    | **31** |

---

## v1 Requirements

### Graph Visualization Core

**Goal:** Children can explore topics through interactive force-directed graph with zoom, pan, and click interactions.

- [ ] **GRAPH-01**: Child can view interactive force-directed graph showing topics as nodes and relationships as edges
- [ ] **GRAPH-02**: Child can zoom in/out on graph using pinch gesture (mobile) or mouse wheel (desktop)
- [ ] **GRAPH-03**: Child can pan across graph by dragging on empty space
- [ ] **GRAPH-04**: Child can click "Reset View" button to return to default zoom/position
- [ ] **GRAPH-05**: Child can click on any topic node to select it and see related videos in sidebar
- [ ] **GRAPH-06**: Selected node highlights with bright border, connected nodes dim slightly to show relationships
- [ ] **GRAPH-07**: Child can see visual distinction between watched topics (dim colors) and unwatched topics (bright colors)
- [ ] **GRAPH-08**: Child sees category filter dropdown to show only topics from selected categories (e.g., "Animals", "Science")
- [ ] **GRAPH-09**: Graph shows clustered/grouped layout with related topics visually closer together (not random scatter)

### Age-Appropriate Modes

**Goal:** Graph complexity adapts to child's cognitive abilities - simplified for toddlers, full features for explorers.

- [ ] **MODE-01**: Explorer mode (ages 5-12) displays full graph with 50-100 topic nodes and all interaction features
- [ ] **MODE-02**: Toddler mode (ages 2-4) displays simplified graph with 5-8 large colorful bubbles representing broad topics
- [ ] **MODE-03**: Toddler mode uses tap-only interactions (no drag, no filters) with 60px+ touch targets
- [ ] **MODE-04**: Toddler mode implements progressive disclosure - tap bubble → zoom to show 2-3 sub-topics → tap to play video

### Data & AI Integration

**Goal:** AI automatically builds smart connections between videos based on topics, categories, and watch patterns.

- [x] **AI-01**: System extracts 3-5 topics per video from title, description, and transcript using OpenAI structured outputs
- [x] **AI-02**: System fuzzy-matches extracted topics against existing entities (92% similarity threshold) to deduplicate
- [x] **AI-03**: System filters out generic topic terms (e.g., "fun", "learning") using TF-IDF specificity scoring
- [x] **AI-04**: System creates topic co-appearance edges weighted by how often topics appear together across videos
- [x] **AI-05**: System creates category-based edges connecting videos with same primary category
- [x] **AI-06**: System creates watch sequence edges connecting topics from videos watched in same session

### Entry Points & Navigation

**Goal:** Children can discover graph from natural entry points and navigate between graph and video watching.

- [ ] **ENTRY-01**: Video watch page shows "Explore Topics" button that opens graph centered on current video's topics
- [ ] **ENTRY-02**: Child home screen shows "My Learning Map" card that opens full child-scoped graph
- [ ] **ENTRY-03**: Clicking topic node in graph shows sidebar with 3-5 related unwatched videos sorted by relevance

### Parent Insights

**Goal:** Parents see actionable insights about child's interests to guide content imports and real-world purchases.

- [ ] **PARENT-01**: Parent dashboard shows top 5-10 topics by total watch time for each child
- [ ] **PARENT-02**: Each topic in parent view shows deep vs shallow engagement (many videos vs few videos watched)
- [ ] **PARENT-03**: Parent dashboard highlights topics child explored but has few videos for (content gaps for import)
- [ ] **PARENT-04**: Parent can click topic to see list of videos watched in that category with timestamps

### Performance & Infrastructure

**Goal:** Graph loads fast (<2s), updates efficiently, and stays responsive at 50-100 node scale.

- [x] **PERF-01**: Graph database schema uses PostgreSQL with GraphNode and GraphEdge tables, child-scoped for isolation
- [x] **PERF-02**: Graph queries use Redis cache (1-hour TTL) for sub-10ms response time, invalidate on watch completion
- [x] **PERF-03**: Graph builder service processes watch history asynchronously via BullMQ jobs (5-10 second rebuild off critical path)

---

## v2 Requirements (Deferred)

### Advanced Discovery Features

- [ ] **AI-07**: System creates edges connecting topics mentioned in AI chat conversations with related video topics
- [ ] **AI-08**: System tracks topic interest momentum over time (rising/falling interest indicators)

---

## Out of Scope

### Explicitly Excluded Features

**These features will NOT be built (anti-features from research):**

- **Show all watched videos as nodes** — Creates unusable 100+ node hairball; v1 shows topics only, videos appear on click in sidebar
- **Real-time graph updates** — Expensive recomputation, visual disruption; v1 rebuilds graph on page load only
- **Search box to find nodes** — Defeats visual exploration purpose; v1 uses category filters and "suggested entry" guidance instead
- **Manual node repositioning** — Breaks force-directed meaning; v1 trusts the algorithm layout
- **3D visualization mode** — No UX benefit for children, accessibility concerns; 2D sufficient
- **Social sharing** — Privacy concerns with children's data
- **Export graph as image** — Rarely used feature, adds complexity
- **Temporal filtering UI** — "Last week" vs "All time" views deferred to v2
- **Suggested unwatched paths highlighting** — Advanced recommendation feature deferred to v2

---

## Traceability Matrix

_This section maps each requirement to its implementation phase._

| REQ-ID    | Requirement Summary                                 | Phase   | Status  |
| --------- | --------------------------------------------------- | ------- | ------- |
| PERF-01   | PostgreSQL graph schema with child-scoped isolation | Phase 1 | Pending |
| PERF-02   | Redis cache with <10ms response time                | Phase 1 | Pending |
| PERF-03   | Asynchronous graph builder via BullMQ               | Phase 1 | Pending |
| AI-01     | OpenAI entity extraction (3-5 topics per video)     | Phase 2 | Pending |
| AI-02     | Fuzzy matching at 92% similarity threshold          | Phase 2 | Pending |
| AI-03     | TF-IDF specificity filtering for generic terms      | Phase 2 | Pending |
| AI-04     | Topic co-appearance edge weights                    | Phase 2 | Pending |
| AI-05     | Category-based edge creation                        | Phase 2 | Pending |
| AI-06     | Watch sequence edge creation                        | Phase 2 | Pending |
| GRAPH-01  | Force-directed graph visualization                  | Phase 3 | Pending |
| GRAPH-02  | Zoom in/out (pinch/wheel)                           | Phase 3 | Pending |
| GRAPH-03  | Pan by dragging empty space                         | Phase 3 | Pending |
| GRAPH-04  | Reset view button                                   | Phase 3 | Pending |
| GRAPH-05  | Click node to select and show videos                | Phase 3 | Pending |
| GRAPH-06  | Node highlight with neighbor dimming                | Phase 3 | Pending |
| GRAPH-07  | Watched/unwatched visual distinction                | Phase 3 | Pending |
| GRAPH-08  | Category filter dropdown                            | Phase 3 | Pending |
| GRAPH-09  | Clustered/grouped layout                            | Phase 3 | Pending |
| MODE-01   | Explorer mode (50-100 nodes, ages 5-12)             | Phase 3 | Pending |
| MODE-02   | Toddler mode (5-8 bubbles, ages 2-4)                | Phase 3 | Pending |
| MODE-03   | Toddler tap-only with 60px+ targets                 | Phase 3 | Pending |
| MODE-04   | Toddler progressive disclosure                      | Phase 3 | Pending |
| ENTRY-01  | "Explore Topics" button on watch page               | Phase 4 | Pending |
| ENTRY-02  | "My Learning Map" card on home screen               | Phase 4 | Pending |
| ENTRY-03  | Click node shows related videos sidebar             | Phase 4 | Pending |
| PARENT-01 | Top 5-10 topics by watch time in dashboard          | Phase 4 | Pending |
| PARENT-02 | Deep vs shallow engagement indicators               | Phase 4 | Pending |
| PARENT-03 | Content gap highlighting (explored but few videos)  | Phase 4 | Pending |
| PARENT-04 | Click topic to see video list with timestamps       | Phase 4 | Pending |

**Coverage:** 29/29 v1 requirements mapped (100%)

---

## Requirements Validation

**Source:** Research from `.planning/research/` (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md)

**Table stakes validated:** All 12 table stakes from FEATURES.md research included in v1 (interactive graph, zoom/pan, watched/unwatched distinction, tooltips, filters, clustering, connection lines, node interactions, loading states, responsive design)

**Differentiators included:** 8 of 12 differentiators in v1 (age-appropriate modes, visual interest strength via node sizing, contextual entry points, parent insights dashboard, deep/shallow engagement indicators)

**Differentiators deferred to v2:** Temporal filtering, suggested unwatched paths, interest momentum tracking, AI chat connections

**Anti-features honored:** Research identified 4 critical anti-features to NOT build - all excluded from v1 and v2 scope

**Success criteria:** Children discovering new videos through positive engagement with graph (measured via click-through rate from graph to video player, session time in graph view, new videos discovered per session)

---

**Last updated:** 2026-02-03 after roadmap creation with 100% requirement coverage
