# Architecture Research

**Domain:** Knowledge Graph Visualization for Video Discovery
**Researched:** 2026-02-03
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Graph View   │  │ Parent       │  │ Video Watch  │              │
│  │ Component    │  │ Insights     │  │ Page (CTA)   │              │
│  │ (Explorer/   │  │ Dashboard    │  │              │              │
│  │  Toddler)    │  │              │  │              │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         └─────────────────┴─────────────────┘                        │
│                           │                                          │
├───────────────────────────┼──────────────────────────────────────────┤
│                      API LAYER                                       │
├───────────────────────────┼──────────────────────────────────────────┤
│  ┌────────────────────────┴─────────────────────┐                   │
│  │     /api/graph/                              │                   │
│  │     - [childId]      (full graph)            │                   │
│  │     - [childId]/video/[videoId] (centered)   │                   │
│  │     - rebuild        (admin trigger)         │                   │
│  └────────────┬─────────────────────────────────┘                   │
│               │                                                      │
├───────────────┼──────────────────────────────────────────────────────┤
│                    SERVICE LAYER                                     │
├───────────────┼──────────────────────────────────────────────────────┤
│  ┌────────────┴────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Graph Builder       │  │ Entity          │  │ Graph Query     │ │
│  │ Service             │  │ Extractor       │  │ Service         │ │
│  │                     │  │ (AI-powered)    │  │                 │ │
│  │ - Process watch     │  │                 │  │ - Top N nodes   │ │
│  │   history           │  │ - Video topics  │  │ - Centered      │ │
│  │ - Calculate weights │  │ - Fuzzy match   │  │   subgraph      │ │
│  │ - Build edges       │  │ - Deduplicate   │  │ - Rank & filter │ │
│  └────────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│               │                    │                     │          │
├───────────────┴────────────────────┴─────────────────────┴──────────┤
│                    DATA ACCESS LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐    │
│  │ Graph Nodes     │  │ Graph Edges     │  │ Watch Sessions   │    │
│  │ (PostgreSQL)    │  │ (PostgreSQL)    │  │ (existing)       │    │
│  │                 │  │                 │  │                  │    │
│  │ - id            │  │ - sourceNodeId  │  │ - childId        │    │
│  │ - childId       │  │ - targetNodeId  │  │ - videoId        │    │
│  │ - type (video,  │  │ - weight        │  │ - duration       │    │
│  │   topic, etc.)  │  │ - relationType  │  │ - completed      │    │
│  │ - label         │  │ - metadata      │  │                  │    │
│  │ - metadata      │  │                 │  │                  │    │
│  │ - watchCount    │  │                 │  │                  │    │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Redis Cache                                                  │    │
│  │ - graph:child:[childId]:full                                │    │
│  │ - graph:child:[childId]:top-100                             │    │
│  │ - graph:child:[childId]:video:[videoId]                     │    │
│  │ TTL: 1 hour (invalidate on new watch session)               │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component             | Responsibility                                              | Typical Implementation                                                       |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Graph View Component  | Render interactive force-directed graph with zoom/pan/click | React Force Graph 2D with custom node/link renderers                         |
| Entity Extractor      | Extract topics/concepts from video metadata using AI        | Ollama/OpenAI with prompt engineering, fuzzy string matching (92% threshold) |
| Graph Builder Service | Process watch history into weighted graph structure         | Background job analyzing watch sessions, calculating co-appearance weights   |
| Graph Query Service   | Fetch and filter graph data for API consumption             | PostgreSQL queries with ranking algorithms, node limiting (top 50-100)       |
| Graph Nodes Table     | Store graph entities (videos, topics, concepts)             | PostgreSQL table with child scoping, metadata JSON field                     |
| Graph Edges Table     | Store weighted relationships between nodes                  | PostgreSQL table with edge weights, relation types                           |
| Cache Layer           | High-performance graph data retrieval                       | Redis with child-scoped keys, 1-hour TTL, watch-session invalidation         |

## Recommended Project Structure

```
apps/web/src/
├── app/
│   ├── api/
│   │   └── graph/                    # Graph API endpoints
│   │       ├── [childId]/
│   │       │   ├── route.ts          # GET full graph for child
│   │       │   └── video/
│   │       │       └── [videoId]/
│   │       │           └── route.ts  # GET centered subgraph
│   │       └── rebuild/
│   │           └── route.ts          # POST rebuild graph (admin)
│   └── [childProfileSlug]/
│       └── graph/
│           └── page.tsx              # Graph visualization page
│
├── components/
│   └── graph/                        # Graph visualization components
│       ├── GraphVisualization.tsx    # Main graph component (client)
│       ├── GraphExplorerMode.tsx     # Full graph for ages 5-12
│       ├── GraphToddlerMode.tsx      # Simplified for ages 2-4
│       ├── GraphNodeDetail.tsx       # Node detail panel
│       └── GraphControls.tsx         # Zoom, filter, reset controls
│
├── lib/
│   ├── graph/                        # Graph domain services
│   │   ├── builder.ts                # Graph construction logic
│   │   ├── entity-extractor.ts       # AI-powered entity extraction
│   │   ├── query.ts                  # Graph query service
│   │   ├── ranker.ts                 # Node ranking algorithms
│   │   └── cache.ts                  # Graph-specific caching
│   │
│   └── db/
│       ├── queries/
│       │   └── graph.ts              # Graph database queries
│       └── migrations/
│           └── add-graph-tables.sql  # Graph schema migration
│
└── workers/
    └── graph-builder.ts              # Background job for graph rebuilding

prisma/schema.prisma                  # Add GraphNode, GraphEdge models
```

### Structure Rationale

- **app/api/graph/**: RESTful API endpoints following Next.js App Router conventions, child-scoped routes for security
- **components/graph/**: Client components (marked 'use client') for interactive visualization, mode-specific implementations
- **lib/graph/**: Server-side business logic for graph construction and querying, reusable across API routes and workers
- **workers/**: Asynchronous graph rebuilding on watch session completion, prevents blocking user interactions

## Architectural Patterns

### Pattern 1: Hybrid Graph Storage (PostgreSQL + Redis)

**What:** Use PostgreSQL for persistent graph storage with Redis as high-performance cache layer.

**When to use:** When graph queries are frequent but graph updates are infrequent (watch sessions complete occasionally, not constantly).

**Trade-offs:**

- **Pros:** Leverages existing PostgreSQL + Prisma infrastructure, Redis provides sub-10ms query times, cache invalidation is simple (watch session triggers rebuild)
- **Cons:** Not a native graph database (no Cypher queries), complex graph traversals require custom SQL or application logic

**Example:**

```typescript
// lib/graph/cache.ts
import { redis } from '@/lib/cache/client';

export async function getCachedGraph(childId: string): Promise<GraphData | null> {
  const cached = await redis.get(`graph:child:${childId}:top-100`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Build from PostgreSQL if cache miss
  const graph = await buildGraphForChild(childId);

  // Cache for 1 hour, invalidate on watch session
  await redis.setex(`graph:child:${childId}:top-100`, 3600, JSON.stringify(graph));

  return graph;
}
```

### Pattern 2: AI-Powered Entity Extraction with Fuzzy Matching

**What:** Extract entities (topics, concepts) from video metadata using LLM, then deduplicate with fuzzy string matching (92% threshold) and Union-Find algorithm.

**When to use:** When building knowledge graphs from unstructured text (video titles, descriptions, transcripts) where entities may be mentioned in slightly different forms.

**Trade-offs:**

- **Pros:** Captures semantic relationships LLMs understand, reduces duplicate nodes ("space exploration" vs "exploring space"), builds richer connections
- **Cons:** LLM API costs/latency, fuzzy matching threshold tuning required, AI extraction quality depends on prompt engineering

**Example:**

```typescript
// lib/graph/entity-extractor.ts
import { aiService } from '@/lib/ai/service';
import Fuse from 'fuse.js';

export async function extractEntities(video: Video): Promise<string[]> {
  const prompt = `Extract 3-5 main topics/concepts from this video:
Title: ${video.title}
Description: ${video.description}
Return as JSON array of strings.`;

  const response = await aiService.generateCompletion(prompt);
  const entities = JSON.parse(response);

  // Fuzzy match against existing entities for child
  const existing = await getExistingEntities(video.familyId);
  const fuse = new Fuse(existing, { threshold: 0.08 }); // 92% similarity

  return entities.map((entity) => {
    const match = fuse.search(entity)[0];
    return match ? match.item : entity; // Use existing if similar
  });
}
```

### Pattern 3: Weighted Edge Construction via Co-Appearance

**What:** Build weighted edges between nodes based on category overlap, topic co-appearance, and sequential watch patterns.

**When to use:** When graph relationships should reflect actual user behavior (what topics appear together, what videos are watched in sequence).

**Trade-offs:**

- **Pros:** Data-driven connections (not just metadata tags), weights reflect engagement strength, discovers non-obvious relationships
- **Cons:** Requires sufficient watch history for meaningful weights, cold-start problem for new users

**Example:**

```typescript
// lib/graph/builder.ts
export async function calculateEdgeWeight(
  sourceNode: GraphNode,
  targetNode: GraphNode,
  watchSessions: WatchSession[]
): Promise<number> {
  let weight = 0;

  // Category overlap: +0.4 per shared category
  const sharedCategories = intersection(
    sourceNode.metadata.categories,
    targetNode.metadata.categories
  );
  weight += sharedCategories.length * 0.4;

  // Topic co-appearance: +0.3 per shared topic
  const sharedTopics = intersection(sourceNode.metadata.topics, targetNode.metadata.topics);
  weight += sharedTopics.length * 0.3;

  // Sequential watch: +0.5 if watched within 1 day
  const sequential = watchSessions.filter((s, i) => {
    const next = watchSessions[i + 1];
    return (
      next &&
      s.videoId === sourceNode.videoId &&
      next.videoId === targetNode.videoId &&
      next.startedAt.getTime() - s.endedAt!.getTime() < 86400000
    );
  });
  weight += sequential.length * 0.5;

  return Math.min(weight, 5.0); // Cap at 5.0
}
```

### Pattern 4: Top-N Node Ranking with PageRank

**What:** Limit displayed nodes to top 50-100 most relevant using ranking algorithm (watch count, edge weights, PageRank centrality).

**When to use:** When full graph is too large for performant visualization (hundreds of nodes would overwhelm force-directed layout).

**Trade-offs:**

- **Pros:** Maintains interactive performance, highlights most important nodes, reduces visual clutter
- **Cons:** Hides less-watched but potentially interesting nodes, ranking algorithm complexity

**Example:**

```typescript
// lib/graph/ranker.ts
export async function rankNodes(nodes: GraphNode[], edges: GraphEdge[]): Promise<GraphNode[]> {
  // Calculate PageRank-style centrality
  const scores = nodes.map((node) => ({
    node,
    score:
      node.watchCount * 0.5 + // Direct engagement
      calculateCentrality(node, edges) * 0.3 + // Network centrality
      node.metadata.recentness * 0.2, // Time decay (recent = higher)
  }));

  // Sort by score, return top 100
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
    .map((s) => s.node);
}
```

## Data Flow

### Graph Building Flow

```
[Watch Session Completes]
    ↓
[API: POST /api/watch/[videoId]/complete]
    ↓
[Queue: enqueueGraphRebuildJob(childId)]
    ↓
[Worker: graph-builder.ts]
    ├─> [Fetch: All watch sessions for child]
    ├─> [Entity Extraction: AI extracts topics from watched videos]
    │   ├─> Prompt: "Extract 3-5 topics from video metadata"
    │   ├─> Fuzzy Match: Deduplicate against existing entities (92% threshold)
    │   └─> Store: GraphNode records (type: 'topic')
    ├─> [Create Video Nodes: One node per watched video]
    │   └─> Store: GraphNode records (type: 'video', watchCount)
    ├─> [Calculate Edge Weights: Co-appearance + categories + sequence]
    │   └─> Store: GraphEdge records (weight, relationType)
    ├─> [Rank Nodes: Top 100 by engagement + centrality]
    └─> [Cache: Redis graph:child:[childId]:top-100 (1h TTL)]
    ↓
[API Response: 200 OK, graph ready]
```

### Graph Query Flow

```
[User: Opens "My Learning Map"]
    ↓
[Component: GraphVisualization.tsx (client)]
    ↓
[API: GET /api/graph/[childId]]
    ├─> [Check Cache: Redis graph:child:[childId]:top-100]
    │   ├─> Cache Hit: Return cached graph (< 10ms)
    │   └─> Cache Miss: Query PostgreSQL
    │       ├─> [Fetch: GraphNode where childId = X, ranked]
    │       ├─> [Fetch: GraphEdge where source/target in nodes]
    │       ├─> [Assemble: { nodes: [], links: [] }]
    │       └─> [Cache: Store in Redis (1h TTL)]
    └─> [Return: GraphData JSON]
    ↓
[Component: Render Force Graph 2D]
    ├─> [Layout: D3-force physics engine]
    ├─> [Nodes: Circle size by watchCount, color by type]
    └─> [Links: Line thickness by weight]
    ↓
[User: Click node "Ocean Mammals"]
    ↓
[Component: onNodeClick(node)]
    ├─> [Highlight: Connected nodes + edges]
    ├─> [Panel: Show related videos for topic]
    └─> [Optional: Navigate to /videos?topic=ocean-mammals]
```

### Centered Subgraph Flow (Video Page)

```
[User: Watches video, clicks "Explore Topics"]
    ↓
[API: GET /api/graph/[childId]/video/[videoId]]
    ├─> [Check Cache: Redis graph:child:[childId]:video:[videoId]]
    │   ├─> Cache Hit: Return cached subgraph
    │   └─> Cache Miss: Build centered subgraph
    │       ├─> [Fetch: Video node + direct neighbors (1-2 hops)]
    │       ├─> [Rank: Top 30 neighbors by edge weight]
    │       └─> [Assemble: Focused graph around current video]
    └─> [Return: GraphData JSON]
    ↓
[Component: GraphVisualization with centerNode prop]
    ├─> [Layout: Pin center node, others arrange around it]
    └─> [Highlight: Current video in distinct color]
```

## Database Schema Design Patterns

### Normalized Graph Tables

**Pattern:** Separate tables for nodes and edges with foreign key relationships.

**Schema:**

```sql
-- Graph Nodes
CREATE TABLE graph_nodes (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('video', 'topic', 'concept', 'category')),
  label TEXT NOT NULL,
  entity_id TEXT, -- Video ID if node_type = 'video'
  watch_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_graph_nodes_child ON graph_nodes(child_id);
CREATE INDEX idx_graph_nodes_type ON graph_nodes(node_type);
CREATE INDEX idx_graph_nodes_watch_count ON graph_nodes(watch_count DESC);

-- Graph Edges
CREATE TABLE graph_edges (
  id TEXT PRIMARY KEY,
  source_node_id TEXT NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  target_node_id TEXT NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  weight DECIMAL(4,2) DEFAULT 1.0,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('watched_together', 'same_category', 'same_topic', 'sequential')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_graph_edges_source ON graph_edges(source_node_id);
CREATE INDEX idx_graph_edges_target ON graph_edges(target_node_id);
CREATE INDEX idx_graph_edges_weight ON graph_edges(weight DESC);
CREATE UNIQUE INDEX idx_graph_edges_unique ON graph_edges(source_node_id, target_node_id, relation_type);
```

**Rationale:**

- Child scoping ensures privacy (siblings don't share graphs)
- JSONB metadata allows flexible storage without schema changes
- Check constraints enforce valid types
- Indexes optimize frequent queries (child graphs, node rankings, edge traversals)
- Cascade deletes maintain referential integrity

### Alternative: Apache AGE Extension (Deferred to v2)

**Pattern:** Use Apache AGE PostgreSQL extension for native graph database capabilities.

**When to consider:**

- Graph traversals become complex (3+ hop queries)
- Need Cypher query language for expressiveness
- Graph analytics (community detection, shortest paths) are required

**Why deferred:**

- Adds infrastructure complexity (AGE extension setup)
- Current use case (1-2 hop queries) is simple enough for normalized tables
- PostgreSQL + Prisma already in stack
- Can migrate later without frontend changes (API stays same)

## Integration Points with PlayPatch Architecture

### Integration 1: Watch Session Hook

**Existing:** `WatchSession` model tracks video watch progress, completion
**New:** Trigger graph rebuild on session completion

**Pattern:**

```typescript
// apps/web/src/app/api/watch/[videoId]/complete/route.ts
export async function POST(req: Request, { params }: { params: { videoId: string } }) {
  const session = await markSessionComplete(params.videoId);

  // Enqueue graph rebuild (non-blocking)
  await addGraphRebuildJob({ childId: session.childId });

  return NextResponse.json({ success: true });
}
```

**Boundary:** Graph builder is asynchronous, doesn't block watch flow

### Integration 2: AI Service for Entity Extraction

**Existing:** `apps/web/src/lib/ai/service.ts` provides Ollama/OpenAI abstraction
**New:** Call AI service with entity extraction prompt

**Pattern:**

```typescript
// lib/graph/entity-extractor.ts
import { aiService } from '@/lib/ai/service';

export async function extractEntities(video: Video): Promise<string[]> {
  const prompt = buildEntityExtractionPrompt(video);
  const response = await aiService.generateCompletion(prompt);
  return parseEntities(response);
}
```

**Boundary:** AI service already abstracts provider (Ollama/OpenAI), graph just calls it

### Integration 3: Prisma Database Layer

**Existing:** Prisma ORM with PostgreSQL database
**New:** Add `GraphNode` and `GraphEdge` models to schema

**Pattern:**

```prisma
// prisma/schema.prisma
model GraphNode {
  id          String   @id @default(cuid())
  childId     String
  child       ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  nodeType    String   // 'video' | 'topic' | 'concept' | 'category'
  label       String
  entityId    String?  // Video ID if nodeType = 'video'
  watchCount  Int      @default(0)
  metadata    Json     @default("{}")

  sourceEdges GraphEdge[] @relation("SourceNode")
  targetEdges GraphEdge[] @relation("TargetNode")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([childId])
  @@index([nodeType])
  @@index([watchCount])
}

model GraphEdge {
  id            String   @id @default(cuid())
  sourceNodeId  String
  sourceNode    GraphNode @relation("SourceNode", fields: [sourceNodeId], references: [id], onDelete: Cascade)
  targetNodeId  String
  targetNode    GraphNode @relation("TargetNode", fields: [targetNodeId], references: [id], onDelete: Cascade)
  weight        Float    @default(1.0)
  relationType  String   // 'watched_together' | 'same_category' | etc.
  metadata      Json     @default("{}")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([sourceNodeId, targetNodeId, relationType])
  @@index([sourceNodeId])
  @@index([targetNodeId])
  @@index([weight])
}
```

**Boundary:** Graph tables are child-scoped, isolated from other features

### Integration 4: Redis Cache Layer

**Existing:** `apps/web/src/lib/cache/client.ts` provides Redis client
**New:** Graph-specific caching with child-scoped keys

**Pattern:**

```typescript
// lib/graph/cache.ts
import { redis } from '@/lib/cache/client';

export async function invalidateGraphCache(childId: string) {
  await redis.del(
    `graph:child:${childId}:top-100`,
    `graph:child:${childId}:full`,
    // Invalidate all video-centered caches
    ...(await redis.keys(`graph:child:${childId}:video:*`))
  );
}
```

**Boundary:** Graph cache uses child-prefixed keys, doesn't conflict with other caches

### Integration 5: React Force Graph 2D

**Existing:** Library already in package.json (`react-force-graph-2d: 1.29.0`)
**New:** Client component for graph visualization

**Pattern:**

```typescript
// components/graph/GraphVisualization.tsx
'use client';
import ForceGraph2D from 'react-force-graph-2d';

export function GraphVisualization({ childId }: { childId: string }) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    fetch(`/api/graph/${childId}`)
      .then(res => res.json())
      .then(setGraphData);
  }, [childId]);

  return (
    <ForceGraph2D
      graphData={graphData}
      nodeCanvasObject={renderNode}
      linkCanvasObject={renderLink}
      onNodeClick={handleNodeClick}
    />
  );
}
```

**Boundary:** Client component fetches from API, SSR handled by Next.js

### Integration 6: BullMQ Job Queue

**Existing:** `apps/web/src/lib/queue/client.ts` manages background jobs
**New:** Graph rebuild job enqueued on watch completion

**Pattern:**

```typescript
// lib/queue/client.ts
export async function addGraphRebuildJob(payload: { childId: string }) {
  return graphRebuildQueue.add('rebuild-graph', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
}

// workers/graph-builder.ts
graphRebuildQueue.process('rebuild-graph', async (job) => {
  const { childId } = job.data;
  await rebuildGraphForChild(childId);
});
```

**Boundary:** Worker runs separately, doesn't block API responses

## Scaling Considerations

| Scale                                     | Architecture Adjustments                                                                                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0-1k users (10-100 watch sessions/day)    | Current architecture sufficient: PostgreSQL handles graph queries, Redis cache keeps response times < 50ms, worker processes rebuilds in background (< 5s per child graph)                                                                       |
| 1k-100k users (1k-10k watch sessions/day) | Optimize graph rebuilds: Incremental updates (only recalculate affected edges) instead of full rebuild, increase worker concurrency, partition Redis cache by child cohorts (families), consider materialized views for top-100 node rankings    |
| 100k+ users (10k+ watch sessions/day)     | Evaluate Apache AGE or dedicated graph database (Neo4j): Native graph traversals for complex queries, horizontal scaling with read replicas, pre-computed graph summaries in cache, CDN for graph API responses (stale-while-revalidate pattern) |

### Scaling Priorities

1. **First bottleneck:** Graph rebuild latency (> 10s for child with 1000+ watch sessions)
   - **Fix:** Incremental edge updates instead of full rebuild, only recalculate changed nodes
   - **Timeline:** Optimize when 10% of users exceed 500 watch sessions

2. **Second bottleneck:** API response time for uncached graphs (> 500ms)
   - **Fix:** PostgreSQL query optimization (EXPLAIN ANALYZE), consider Apache AGE for complex traversals
   - **Timeline:** Optimize when P95 latency exceeds 200ms

3. **Third bottleneck:** Redis cache eviction pressure (> 80% memory usage)
   - **Fix:** Tiered caching (hot graphs in Redis, warm graphs in database, cold graphs rebuild on-demand)
   - **Timeline:** Optimize when Redis memory usage consistently > 70%

## Anti-Patterns

### Anti-Pattern 1: Synchronous Graph Rebuild on Watch Completion

**What people do:** Rebuild entire graph synchronously when watch session completes, blocking API response until graph is ready.

**Why it's wrong:** Watch completion is a frequent event (every video watched), graph rebuild can take 5-10 seconds for large graphs, blocks user experience (e.g., "Continue Watching" loading spinner hangs).

**Do this instead:** Enqueue graph rebuild job asynchronously via BullMQ, return 200 OK immediately to client, graph updates in background and invalidates cache when complete.

**Example:**

```typescript
// ❌ Bad: Synchronous rebuild
export async function POST(req: Request) {
  await markSessionComplete(videoId);
  await rebuildGraphForChild(childId); // Blocks for 5-10s
  return NextResponse.json({ success: true });
}

// ✅ Good: Asynchronous rebuild
export async function POST(req: Request) {
  await markSessionComplete(videoId);
  await addGraphRebuildJob({ childId }); // Enqueues, returns immediately
  return NextResponse.json({ success: true });
}
```

### Anti-Pattern 2: Full Graph Without Node Limiting

**What people do:** Return entire graph (all nodes, all edges) from API, let client-side filter to top 100.

**Why it's wrong:** Large graphs (500+ nodes) cause massive payload (> 1MB JSON), browser lags rendering force-directed layout, network transfer time dominates (> 2s on slow connections).

**Do this instead:** Rank and limit nodes on server-side (top 50-100), return minimal payload (< 100KB), client renders immediately with smooth 60fps layout.

**Example:**

```typescript
// ❌ Bad: Full graph, client filtering
export async function GET(req: Request) {
  const allNodes = await prisma.graphNode.findMany({ where: { childId } });
  const allEdges = await prisma.graphEdge.findMany({
    /* all edges */
  });
  return NextResponse.json({ nodes: allNodes, links: allEdges }); // 1MB+
}

// ✅ Good: Server-side ranking and limiting
export async function GET(req: Request) {
  const rankedNodes = await getRankedNodes(childId, { limit: 100 });
  const relevantEdges = await getEdgesForNodes(rankedNodes.map((n) => n.id));
  return NextResponse.json({ nodes: rankedNodes, links: relevantEdges }); // < 100KB
}
```

### Anti-Pattern 3: AI Entity Extraction on Every API Call

**What people do:** Extract entities from video metadata every time graph is queried, call OpenAI/Ollama API on each request.

**Why it's wrong:** AI API calls have 200-500ms latency, add cost ($0.01-0.05 per request), same video analyzed repeatedly (wasteful), breaks caching strategy.

**Do this instead:** Extract entities once during graph rebuild (background job), store in `GraphNode.metadata`, cache extracted entities in database, only re-extract if video metadata changes.

**Example:**

```typescript
// ❌ Bad: Extract on every query
export async function GET(req: Request) {
  const videos = await getWatchedVideos(childId);
  const entities = await Promise.all(
    videos.map((v) => extractEntities(v)) // AI call for each video
  );
  return buildGraph(entities);
}

// ✅ Good: Extract during rebuild, cache in database
// Worker: graph-builder.ts
async function rebuildGraphForChild(childId: string) {
  const videos = await getWatchedVideos(childId);

  for (const video of videos) {
    // Check if entities already extracted
    const node = await prisma.graphNode.findUnique({
      where: { entityId: video.id },
    });

    if (!node) {
      const entities = await extractEntities(video); // AI call once
      await prisma.graphNode.create({
        data: { childId, nodeType: 'video', entityId: video.id, metadata: { entities } },
      });
    }
  }
}
```

### Anti-Pattern 4: Bidirectional Edges Without Deduplication

**What people do:** Create separate edges for `A → B` and `B → A` relationships, doubling edge count and confusing force-directed layout.

**Why it's wrong:** Undirected relationships (topics co-appear) stored twice, edge weights split between duplicates, force graph renders both directions (visual clutter).

**Do this instead:** Store undirected edges once with consistent ordering (e.g., `sourceId < targetId` lexicographically), query edges with OR condition for both directions, client renders single link.

**Example:**

```typescript
// ❌ Bad: Bidirectional edges
await prisma.graphEdge.createMany({
  data: [
    { sourceNodeId: 'A', targetNodeId: 'B', weight: 2.5 },
    { sourceNodeId: 'B', targetNodeId: 'A', weight: 2.5 }, // Duplicate
  ],
});

// ✅ Good: Deduplicated edges with ordering
async function createEdge(nodeA: string, nodeB: string, weight: number) {
  const [source, target] = [nodeA, nodeB].sort(); // Consistent ordering
  await prisma.graphEdge.upsert({
    where: { sourceNodeId_targetNodeId: { sourceNodeId: source, targetNodeId: target } },
    update: { weight },
    create: { sourceNodeId: source, targetNodeId: target, weight },
  });
}
```

## Performance and Caching Strategy

### Caching Layers

**L1: Redis Cache (Hot Path)**

- **Keys:** `graph:child:[childId]:top-100`, `graph:child:[childId]:video:[videoId]`
- **TTL:** 1 hour (invalidate on watch session completion)
- **Hit Rate Target:** > 90% (most graph views are repeat visits)
- **Eviction:** LRU (least recently used)

**L2: PostgreSQL (Warm Path)**

- **Query:** Pre-ranked nodes (`ORDER BY watch_count DESC, centrality DESC LIMIT 100`)
- **Indexes:** Composite index on `(child_id, watch_count DESC, node_type)`
- **Performance:** < 50ms for top-100 query

**L3: Background Rebuild (Cold Path)**

- **Trigger:** First graph request for child (cache miss + no database records)
- **Queue:** BullMQ job with priority (new users get priority)
- **Fallback:** Return empty graph with "Building your learning map..." message

### Cache Invalidation Strategy

**On Watch Session Completion:**

```typescript
// apps/web/src/app/api/watch/[videoId]/complete/route.ts
export async function POST(req: Request) {
  const session = await markSessionComplete(videoId);

  // Invalidate graph cache for this child
  await invalidateGraphCache(session.childId);

  // Enqueue rebuild (asynchronous)
  await addGraphRebuildJob({ childId: session.childId });

  return NextResponse.json({ success: true });
}
```

**Rebuild Updates Cache Atomically:**

```typescript
// workers/graph-builder.ts
async function rebuildGraphForChild(childId: string) {
  // Build new graph
  const graph = await buildGraph(childId);

  // Atomically update cache and database
  const multi = redis.multi();
  multi.setex(`graph:child:${childId}:top-100`, 3600, JSON.stringify(graph));
  multi.del(...(await redis.keys(`graph:child:${childId}:video:*`)));
  await multi.exec();

  await prisma.$transaction([
    prisma.graphNode.deleteMany({ where: { childId } }),
    prisma.graphNode.createMany({ data: graph.nodes }),
    prisma.graphEdge.deleteMany({ where: { sourceNode: { childId } } }),
    prisma.graphEdge.createMany({ data: graph.edges }),
  ]);
}
```

### Query Optimization

**N+1 Query Prevention:**

```typescript
// ❌ Bad: N+1 queries for edges
const nodes = await prisma.graphNode.findMany({ where: { childId } });
for (const node of nodes) {
  const edges = await prisma.graphEdge.findMany({
    where: { sourceNodeId: node.id },
  });
}

// ✅ Good: Single query with include
const nodes = await prisma.graphNode.findMany({
  where: { childId },
  include: {
    sourceEdges: { include: { targetNode: true } },
    targetEdges: { include: { sourceNode: true } },
  },
});
```

**Pagination for Large Graphs:**

```typescript
// For parent insights view (can show more nodes)
export async function GET(req: Request, { params }: { params: { childId: string } }) {
  const { page = 1, limit = 100 } = await req.json();

  const nodes = await prisma.graphNode.findMany({
    where: { childId: params.childId },
    orderBy: [{ watchCount: 'desc' }, { updatedAt: 'desc' }],
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({ nodes, page, hasMore: nodes.length === limit });
}
```

## Sources

### Knowledge Graph Visualization Architecture

- [GitHub - tohsaka888/react-knowledge-graph](https://github.com/tohsaka888/react-knowledge-graph)
- [LLM Knowledge Graph Builder Front-End Architecture](https://medium.com/neo4j/llm-knowledge-graph-builder-frontend-architecture-and-integration-99922318a90b)
- [Next.js data visualization for faster graph apps](https://cambridge-intelligence.com/nextjs-and-regraph-for-faster-apps/)
- [GitHub - reaviz/reagraph: WebGL Graph Visualizations for React](https://github.com/reaviz/reagraph)

### Graph Database Integration with PostgreSQL

- [PostgreSQL Graph Database: Everything You Need To Know](https://www.puppygraph.com/blog/postgresql-graph-database)
- [Knowledge Graphs with PostgreSQL](https://app.readytensor.ai/publications/knowledge-graphs-with-postgresql-eQyINuo4ojwW)
- [GitHub - apache/age: Graph database optimized for fast analysis](https://github.com/apache/age)
- [Apache AGE Extension - Azure Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/generative-ai-age-overview)
- [Building Graph Database Applications with Apache AGE and Node.js](https://dev.to/omarsaad/building-graph-database-applications-with-apache-age-and-nodejs-a-step-by-step-tutorial-33a1)

### React Force Graph 2D

- [GitHub - vasturiano/react-force-graph](https://github.com/vasturiano/react-force-graph)
- [react-force-graph-2d - npm](https://www.npmjs.com/package/react-force-graph-2d)
- [Graph Data Visualization With GraphQL & react-force-graph](https://lyonwj.com/blog/graph-visualization-with-graphql-react-force-graph)
- [Visualizing Data Mesh with React ForceGraph2D](https://qulia.medium.com/visualizing-data-mesh-with-react-forcegraph2d-24c438ffa203)

### Entity Extraction & Knowledge Graphs

- [Creating Knowledge Graphs from Unstructured Data](https://neo4j.com/developer/genai-ecosystem/importing-graph-from-unstructured-data/)
- [Named Entity Extraction for Knowledge Graphs: A Literature Overview](https://ieeexplore.ieee.org/document/8999622/)
- [GliNER2: Extracting Structured Information from Text](https://towardsdatascience.com/gliner2-extracting-structured-information-from-text/)
- [Building a Knowledge Graph: A Comprehensive End-to-End Guide](https://medium.com/@brian-curry-research/building-a-knowledge-graph-a-comprehensive-end-to-end-guide-using-modern-tools-e06fe8f3b368)
- [How to Extract Entities and Build a Knowledge Graph with Memgraph and SpaCy](https://memgraph.com/blog/extract-entities-build-knowledge-graph-memgraph-spacy)
- [Video2Entities: A computer vision-based entity extraction framework](https://www.sciencedirect.com/science/article/abs/pii/S0926580521000686)

### Performance & Caching Optimization

- [Blazing Fast GraphQL Execution with Query Caching & Postgres Prepared Statements](https://hasura.io/blog/fast-graphql-execution-with-query-caching-prepared-statements)
- [The PostgreSQL Feature That Made Our Entire Caching Layer Embarrassing](https://medium.com/@maahisoft20/the-postgresql-feature-that-made-our-entire-caching-layer-embarrassing-ad3332141bfd)
- [Caching Layer in Postgres - Neon Guides](https://neon.com/guides/caching-with-materialized-views)
- [PostgreSQL 17 Performance Upgrade 2026](https://medium.com/@DevBoostLab/postgresql-17-performance-upgrade-2026-f4222e71f577)

### Next.js Advanced Patterns

- [Next.js 15 Advanced Patterns: App Router, Server Actions, and Caching Strategies for 2026](https://johal.in/next-js-15-advanced-patterns-app-router-server-actions-and-caching-strategies-for-2026/)
- [Next.js Advanced Techniques 2026: 15+ Pro-Level Tips](https://medium.com/@elizacodewell72/next-js-advanced-techniques-2026-15-pro-level-tips-every-senior-developer-must-master-0b264649980e)
- [Full Stack GraphQL With Next.js, Neo4j AuraDB And Vercel](https://www.smashingmagazine.com/2023/03/full-stack-graphql-nextjs-neo4j-auradb-vercel/)

---

_Architecture research for: Knowledge Graph Visualization for Video Discovery_
_Researched: 2026-02-03_
