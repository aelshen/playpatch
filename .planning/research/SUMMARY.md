# Project Research Summary

**Project:** Interactive Knowledge Graph for Visual Topic Discovery
**Domain:** Children's educational video platform with AI-powered relationship visualization
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

This project adds interactive knowledge graph visualization to a children's video platform, enabling visual discovery of topics and relationships extracted from watch history. Expert consensus for 2026 is clear: use **Canvas-based force-directed graphs** (React Force Graph 2D, already installed), **PostgreSQL with Prisma** for graph storage (no separate graph DB needed at 50-100 node scale), and **OpenAI structured outputs** for AI entity extraction from video metadata. This approach leverages existing infrastructure, delivers 60 FPS performance for the target node count, and avoids architectural complexity.

The recommended implementation pattern is **hybrid storage** (PostgreSQL + Redis cache), **asynchronous graph building** (BullMQ jobs triggered on watch completion), and **age-appropriate simplification** (Toddler mode with 10-15 large bubbles vs Explorer mode with 50-100 nodes). This dual-mode approach respects cognitive differences between 2-4 year olds and 5-12 year olds while maintaining shared architecture.

Critical risks center on three areas: (1) **performance collapse** at scale if node limits aren't enforced from day one, (2) **over-connected hairball graphs** if AI extraction lacks specificity filtering, and (3) **toddler usability failure** if designed for older children and simplified later. All three require prevention in foundational phases—architectural decisions and AI prompt engineering are expensive to change post-launch. The research provides clear mitigation strategies: hard 100-node limits, TF-IDF entity scoring, and actual toddler user testing before feature completion.

## Key Findings

### Recommended Stack

The 2026 standard for interactive knowledge graph visualization in React is Canvas-based rendering with server-side graph data management. Every core technology needed is already in the stack—React Force Graph 2D (1.29.0), Next.js 15, Prisma with PostgreSQL, OpenAI API (6.16.0), and Zustand for state management.

**Core technologies:**

- **React Force Graph 2D (installed):** Canvas 2D rendering provides 60 FPS for <5k nodes with optimal performance at 50-100 node range (the target). Built-in zoom, pan, click interactions. Industry standard for React graph visualization.
- **PostgreSQL + Prisma (installed):** Sufficient for 2-3 hop graph traversals at this scale. Use normalized nodes/edges tables pattern. Apache AGE extension deferred until 100k+ nodes or complex traversals required.
- **OpenAI Structured Outputs (installed):** Type-safe entity extraction from video metadata with 100% schema adherence via Zod schemas. Zero training required, superior semantic understanding compared to spaCy/NLTK.
- **Zustand (installed):** Perfect for graph UI state (selected nodes, filters, zoom level). Minimal re-renders, hook-based API, already in stack.
- **Redis cache (existing):** Essential for sub-10ms graph query response times. Child-scoped keys with 1-hour TTL, invalidate on watch completion.

**Critical version notes:**

- Canvas 2D optimal until 5k nodes (10x beyond target)
- gpt-4o-mini sufficient for entity extraction, gpt-4o for higher quality
- No additional dependencies required beyond optional d3-force-cluster for visual clustering

### Expected Features

Research reveals clear table stakes vs differentiators for knowledge graph discovery interfaces. Missing table stakes makes the product feel broken; differentiators provide competitive advantage.

**Must have (table stakes):**

- Interactive force-directed graph with zoom/pan/reset
- Node click to select/highlight with related video sidebar
- Visual distinction for watched (dim) vs unwatched (bright) nodes
- Hover tooltips, loading states, responsive to screen size
- Filter by category dropdown to reduce visible complexity
- Clustered/grouped layout (not random scatter)
- Connection lines showing topic relationships

**Should have (competitive advantage):**

- Age-appropriate simplification: Toddler mode (2-4, big bubbles, tap-only) vs Explorer mode (5-12, full features)
- Visual interest strength via node sizing (watch time = node size, engagement depth visible to parents)
- Click node → zoom/focus mode showing only neighborhood
- Contextual entry from video watch page ("Explore Topics" centers on current video)
- Temporal filtering ("Last week" vs "All time" interests)
- Suggested unwatched paths highlighting discoverable content
- Parent insights dashboard integration (top topics, coverage metrics)

**Defer (v2+):**

- Interest momentum tracking (requires 3+ months longitudinal data)
- AI chat integration in graph (separate use case, high complexity)
- 3D visualization mode (no UX benefit, accessibility concerns)
- Social sharing (privacy concerns with children's data)
- Export graph as image (rarely used, adds complexity)

**Anti-features (DO NOT BUILD):**

- Show all watched videos as nodes (creates unusable 100+ node hairball—show topics only, videos on click)
- Real-time graph updates (expensive recomputation, visual disruption—rebuild on page load only)
- Search box to find nodes (defeats visual exploration purpose—use "suggested entry" guidance instead)
- Manual node repositioning (breaks force-directed meaning—trust the algorithm)

### Architecture Approach

Standard pattern is hybrid storage with asynchronous background processing. PostgreSQL stores persistent graph structure (normalized nodes/edges tables with child scoping), Redis caches computed graphs (1-hour TTL), and BullMQ processes graph rebuilds asynchronously when watch sessions complete.

**Major components:**

1. **Graph Builder Service** — Background worker that processes watch history, calls AI entity extraction, calculates edge weights (co-appearance + categories + sequence), ranks nodes, stores in PostgreSQL, updates Redis cache.
2. **Entity Extractor** — Prompts OpenAI with video metadata, extracts 3-5 topics per video, fuzzy-matches against existing entities (92% similarity threshold) for deduplication, filters generic terms via TF-IDF scoring.
3. **Graph Query Service** — API endpoints serving top-N ranked graphs (full child graph or video-centered subgraph), checks Redis cache first, falls back to PostgreSQL with ranking queries, child-scoped for security.
4. **Graph Visualization Component** — Client-side React Force Graph 2D with mode switching (Toddler/Explorer), custom node rendering (thumbnails, sizing by watch time), interaction handlers (click → sidebar, zoom, filter).
5. **Graph Cache Layer** — Redis with child-prefixed keys (`graph:child:[id]:top-100`), invalidation on watch completion, atomic cache updates during rebuild, LRU eviction.

**Key architectural decisions validated by research:**

- Canvas 2D dominates WebGL for <5k nodes (2.6x faster initial load)
- PostgreSQL sufficient vs Neo4j at 50-100 node scale with 2-3 hop queries
- Server Components for data fetching, Client Component for graph rendering (Next.js 15 pattern)
- Asynchronous graph rebuild prevents blocking user interactions (5-10 second rebuild off critical path)

### Critical Pitfalls

Research identified six critical pitfalls with clear prevention strategies. Top three demand foundational phase attention:

1. **Force-directed layout performance collapse at scale** — Computational complexity increases quadratically. Prevent: Set hard 100-node visible limits, implement ranking algorithm (watch count + centrality + recency), test with 10x expected data (1000 nodes), use Web Workers for layout if needed. Address in Phase 1 (Foundation)—library choice is expensive to change.

2. **Over-connected knowledge graph creating noise** — AI extraction produces generic hub nodes ("learning," "fun") with hundreds of edges, turning graph into meaningless hairball. Prevent: Filter entities by specificity (TF-IDF scoring), blacklist generic terms, set minimum edge weight thresholds (prune <0.3), limit visible edges per node (top 5-10 strongest). Address in Phase 2 (AI Integration)—entity quality must be validated before building UI on top.

3. **Cognitive overload for target age group (2-4 years)** — Adult-designed graphs overwhelm toddlers who can only hold 4-7 items in short-term memory. Prevent: Toddler mode with 5-8 visible nodes max, 60px+ touch targets, progressive disclosure (show 1 → click → show 3 neighbors), test with actual 2-4 year olds. Address in Phase 3 (UI Design)—requires real toddler testing before launch.

4. **AI entity extraction inconsistency and hallucinations** — Same video analyzed twice produces different entities, nonsensical connections appear credible. Prevent: Consensus approach (run extraction multiple times, keep consistent entities), validate against known dictionaries, store confidence scores, human review sampling.

5. **Privacy theater without real parent insights** — Compliance checkboxes without value. Prevent: Zero third-party analytics from start, design privacy controls around parent value ("See what topics your child explores"), simple visual privacy dashboard, default to maximum privacy with opt-in.

6. **Graph query performance degradation over time** — Fast with 100 videos, 10x slower with 1,000 videos. Prevent: Index all relationship types, multi-level caching (result + data + node), limit traversal depth (max 3-4 hops), benchmark at 10x scale, monitor 95th percentile query time.

## Implications for Roadmap

Based on research, suggested 4-phase structure follows dependency order discovered in architecture and pitfall analysis:

### Phase 1: Foundation & Data Pipeline

**Rationale:** Graph visualization requires data to render. Entity extraction and graph building must work before UI can be built. Foundational architecture decisions (PostgreSQL schema, caching strategy, node ranking) are expensive to change later.

**Delivers:**

- Database schema (GraphNode, GraphEdge models in Prisma)
- AI entity extraction service with fuzzy matching and deduplication
- Graph builder service (background job processing watch history)
- Redis caching layer with child-scoped keys
- API endpoints for graph queries

**Features addressed:**

- Core graph rendering prerequisites (nodes, edges, metadata)
- Privacy architecture (child-scoped data, no third-party analytics)

**Pitfalls avoided:**

- Performance collapse (architecture supports 100-node limit from day one)
- Privacy violations (first-party data architecture established)
- Query performance issues (indexes and caching designed upfront)

**Research flag:** STANDARD PATTERNS — PostgreSQL graph storage, Prisma ORM, and BullMQ job patterns are well-documented. Skip deep research, follow established patterns.

### Phase 2: AI Integration & Entity Quality

**Rationale:** Entity extraction quality determines graph usefulness. Must validate AI produces specific, meaningful entities before building UI dependent on entity data. Iterate on prompt engineering and filtering before moving to visualization.

**Delivers:**

- OpenAI structured outputs integration with Zod schemas
- Entity specificity filtering (TF-IDF scoring)
- Generic term blacklist ("fun," "learning," "educational")
- Edge weight calculation (co-appearance, categories, sequence)
- Hallucination detection and consistency validation

**Features addressed:**

- Meaningful topic relationships (not hairball)
- Interest strength calculation (watch time per topic)

**Pitfalls avoided:**

- Over-connected hairball graphs (specificity filtering prevents generic hub nodes)
- AI extraction inconsistency (consensus approach and validation)
- Noise overwhelming signal (edge weight pruning)

**Research flag:** NEEDS RESEARCH — Prompt engineering for children's content entity extraction may require iteration. Plan for `/gsd:research-phase` focused on prompt optimization and entity quality metrics.

### Phase 3: Interactive Visualization & Age Modes

**Rationale:** With quality graph data available, build visualization layer with age-appropriate simplification designed from start (not retrofit). Toddler cognitive constraints demand separate mode, not simplified version of adult interface.

**Delivers:**

- React Force Graph 2D integration with Canvas rendering
- Explorer mode (5-12): 50-100 nodes, full zoom/pan/filter
- Toddler mode (2-4): 5-8 large bubbles, tap-only, progressive disclosure
- Node rendering with thumbnails and sizing by watch time
- Interaction handlers (click → sidebar, highlight neighbors, filter by category)
- Loading states, reset/recenter controls

**Features addressed:**

- Interactive force-directed graph with zoom/pan/reset (table stakes)
- Age-appropriate simplification (differentiator)
- Visual distinction watched/unwatched, hover tooltips, clustering

**Pitfalls avoided:**

- Cognitive overload for toddlers (separate mode with 5-8 nodes, large touch targets)
- Client-side rendering limits (Canvas 2D optimal for target scale)
- UX confusion (progressive disclosure, clear visual feedback)

**Research flag:** NEEDS VALIDATION — Toddler usability testing critical. Budget for user testing with actual 2-4 year olds and iteration based on findings.

### Phase 4: Advanced Features & Parent Insights

**Rationale:** Core graph exploration working, now add differentiators that increase parent value and discovery effectiveness. Contextual entry points and parent analytics build on foundation.

**Delivers:**

- Click node → zoom/focus mode (neighborhood subgraph)
- Contextual entry from video watch page (centered graph)
- Temporal filtering ("Last week" vs "All time")
- Parent insights dashboard (top topics, interest depth, coverage metrics)
- Suggested unwatched paths highlighting
- Mobile optimization and performance tuning

**Features addressed:**

- Visual interest strength (node sizing, parent insights)
- Contextual entry (differentiator)
- Suggested unwatched paths (discovery guidance)

**Pitfalls avoided:**

- Mobile performance issues (optimizations addressed in this phase)
- Privacy theater (parent insights provide real value)

**Research flag:** STANDARD PATTERNS — Parent dashboard and filtering patterns well-established. Minor research may be needed for recommendation algorithms.

### Phase Ordering Rationale

- **Foundation before visualization:** Can't render graph without data pipeline. Architecture decisions (database schema, caching) expensive to change.
- **AI quality before UI:** Building UI on low-quality entity data wastes effort. Iterate on extraction quality in isolation.
- **Core modes before advanced features:** Explorer and Toddler modes are table stakes. Advanced features (focus mode, temporal filtering) depend on core working.
- **Parent insights last:** Requires working graph exploration to generate engagement metrics for dashboard.

**Dependency cascade validated by research:**

- Graph Builder → Entity Extractor → Graph Nodes/Edges (can't build without extraction)
- Graph Query → Cache Layer → Database (query optimization requires data structure)
- Graph Visualization → Graph Query API (client needs server data)
- Age Modes → Core Visualization (modes are variations of core component)
- Parent Insights → Watch History Analytics → Graph Data (metrics require usage data)

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 2 (AI Integration):** Entity extraction prompt engineering for children's content is niche. Plan for `/gsd:research-phase` focused on OpenAI structured outputs prompts, entity specificity scoring, and hallucination detection strategies. Budget 1-2 days for prompt iteration and quality validation.
- **Phase 3 (UI Design):** Toddler usability testing methodology requires validation. May need `/gsd:research-phase` on children's UX testing best practices, recruiting 2-4 year old testers, and age-appropriate design patterns.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Foundation):** PostgreSQL graph storage with Prisma, Redis caching, and BullMQ job patterns are well-documented. Follow established architecture patterns from ARCHITECTURE.md research.
- **Phase 4 (Advanced Features):** Dashboard design, filtering UIs, and recommendation algorithms have extensive prior art. Reference FEATURES.md research for proven patterns.

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                                                       |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | All technologies already installed and version-validated. React Force Graph 2D, Prisma, OpenAI, Zustand, Redis confirmed as 2026 standards via official docs and benchmarks.                |
| Features     | HIGH       | Table stakes vs differentiators validated across multiple sources (academic research, industry examples, competitor analysis). MVP definition clear with explicit anti-features.            |
| Architecture | HIGH       | Hybrid storage pattern (PostgreSQL + Redis) proven at target scale (50-100 nodes). Server/client component split standard Next.js 15 approach. Asynchronous processing pattern established. |
| Pitfalls     | HIGH       | Critical pitfalls extracted from academic papers, production case studies, and performance benchmarks. Prevention strategies validated with concrete examples and recovery costs.           |

**Overall confidence:** HIGH

Research drew from authoritative sources including official documentation (OpenAI, Next.js, React Force Graph), peer-reviewed papers (IEEE, Nature, ScienceDirect), and recent industry analyses (2024-2026). Stack recommendations validated against benchmarks (Canvas vs WebGL performance, PostgreSQL vs Neo4j at scale). Feature research cross-referenced educational UX patterns, children's interface guidelines, and COPPA compliance requirements.

### Gaps to Address

**Minor gaps requiring validation during implementation:**

- **Entity specificity threshold tuning:** Research recommends TF-IDF scoring and 92% fuzzy matching, but optimal thresholds for children's video content may need calibration. Handle by: Implement configurable thresholds, monitor entity quality metrics in Phase 2, iterate based on parent feedback about graph usefulness.

- **Toddler node count optimization:** Research suggests 5-8 nodes for 2-4 year olds, but exact count may vary by cognitive development. Handle by: Implement configurable limits, test with multiple toddler cohorts in Phase 3, observe engagement patterns (too few = boredom, too many = confusion).

- **Cache TTL optimization:** Research recommends 1-hour Redis TTL, but ideal balance between freshness and cache hits depends on watch session frequency. Handle by: Start with 1-hour, monitor cache hit ratio and staleness complaints, adjust TTL in Phase 4 based on production metrics.

- **Edge weight calculation formula:** Research provides co-appearance + categories + sequence pattern, but weights (0.4, 0.3, 0.5) are heuristics. Handle by: Implement configurable weights, A/B test different formulas in Phase 4, optimize for discovery rate (videos watched from graph exploration).

None of these gaps are blockers. All have clear mitigation strategies (configurable parameters, metrics-driven tuning, user testing). Proceed to roadmap creation with these flagged for Phase 2-4 validation.

## Sources

### Primary (HIGH confidence)

- OpenAI Structured Outputs Documentation — Entity extraction type safety, schema adherence validation
- Next.js 15 Official Documentation — Server/Client Component patterns, App Router architecture
- React Force Graph GitHub & Documentation — Performance characteristics, Canvas vs WebGL benchmarks, interaction APIs
- PostgreSQL vs Neo4j Architecture Comparisons — Scale thresholds, query patterns, when to use each
- COPPA Compliance Guides (2025) — Children's privacy requirements, third-party analytics restrictions

### Secondary (MEDIUM confidence)

- IEEE/Nature papers on knowledge graph visualization UX — Cognitive load research, performance optimization strategies
- Cambridge Intelligence graph visualization guides — Anti-patterns, best practices, enterprise use cases
- Children's UX design research (NN/g, academic papers) — Age-appropriate interface patterns, toddler cognitive constraints
- React state management comparisons (2025-2026) — Zustand vs alternatives for graph UI state
- Graph database performance studies — Caching strategies, query optimization, scaling patterns

### Tertiary (LOW confidence)

- d3-force-cluster community plugin documentation — Visual clustering approach (less widely adopted, validate if using)
- Graphology TypeScript library — Graph algorithms (newer, less battle-tested at scale)

**Source quality validation:** All stack recommendations verified against official documentation. Feature research cross-referenced with 3+ independent sources. Pitfall patterns extracted from production case studies and academic performance analyses. No recommendations based on single sources or speculation.

---

_Research completed: 2026-02-03_
_Ready for roadmap: yes_
