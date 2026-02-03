# Phase 1: Foundation & Data Pipeline - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Database and API infrastructure for storing and querying graph nodes and edges with child-scoped isolation and sub-10ms response times. This phase creates the data layer foundation - schema, caching, async processing, and API endpoints. Visualization and AI entity extraction are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Graph Schema Design

**Node-Video Relationship:**

- GraphNode represents topics, separate from Video table (not foreign key to Video)
- Many-to-many join table connects topics to videos
- Topics exist as independent entities that can relate to multiple videos

**GraphNode Metadata:**

- Label and normalized label (display name + lowercase/deduplicated version for fuzzy matching)
- Category/domain classification ("Animals", "Science", "Art") for filtering and clustering
- Engagement metrics: total watch time, video count, first/last seen timestamps

**GraphEdge Relationship Information:**

- Weight field (0-1 float) for edge strength
- Metadata JSON field for relationship context:
  - Videos involved in creating this edge
  - Timestamps of relationship creation
  - Breakdown of weight components (co-appearance, category, sequence)
  - Flexible for future relationship types

### API Endpoint Design

**Query Capabilities:**
All four query types required in Phase 1:

- Full child graph (top 50-100 ranked nodes/edges)
- Video-centered subgraph (graph focused on specific video's topics for "Explore Topics" button)
- Category-filtered graph (show only selected categories)
- Topic neighborhood (single topic with immediate neighbors for click-to-focus)

**Related Videos Handling:**

- Both approaches: Embed top 3 related videos per node in graph response
- Separate endpoint for full video list per topic: GET /api/graph/topic/:id/videos
- Initial graph includes preview, on-demand loading for complete list

### Child Isolation Approach

**Enforcement Mechanism:**

- Prisma middleware automatically injects child filter in all graph queries
- Application-level enforcement, safer than manual WHERE clauses everywhere
- Middleware intercepts queries before execution, adds childId condition

**Cross-Boundary Behavior:**

- Silent filtering if query accidentally crosses child boundaries
- Return empty results, log warning for investigation
- Don't throw errors - fail gracefully to avoid breaking UI

**Parent Access:**

- Both explicit child selection and family view support
- Parent can query specific child graph (pass childId explicitly)
- Parent can query aggregated family graph (combines all children for parent dashboard)
- Phase 1 includes foundation for both patterns, Phase 4 builds parent UI

### Claude's Discretion

**Areas where Claude has flexibility:**

- API style choice (REST, tRPC, or GraphQL) - evaluate existing PlayPatch patterns and choose best fit
- Response format structure (nodes/edges arrays vs adjacency list) - optimize for React Force Graph 2D consumption and cache efficiency
- Redis cache key structure - choose between prefixed keys (graph:child:[id]:top-100) or other patterns based on invalidation needs
- Indexing strategy - standard Prisma relations vs custom composite indexes, evaluate query patterns and choose optimal approach

</decisions>

<specifics>
## Specific Ideas

**Performance Target:**

- Redis cache must return queries in <10ms (hard requirement from success criteria)
- This guides cache structure decisions and data format choices

**Child Isolation Priority:**

- User emphasized "child-scoped isolation" multiple times in phase goal
- This is a security/privacy concern, not just data organization
- Prisma middleware chosen specifically for safety vs manual WHERE clauses

**Phase 4 Preview:**

- Parent dashboard (Phase 4) needs both per-child and family-wide views
- Foundation must support both query patterns from Phase 1
- Don't build parent UI now, but API must enable it later

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

_Phase: 01-foundation-data-pipeline_
_Context gathered: 2026-02-03_
