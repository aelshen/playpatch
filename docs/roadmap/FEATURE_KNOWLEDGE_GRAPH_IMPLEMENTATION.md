# Knowledge Graph: Society Map Implementation Guide

**Based on:** "The Society Map" concept from book visualization app
**Adapted for:** Children's educational video platform

## Core Differences: Books vs Videos

| Society Map (Books) | PlayPatch Knowledge Graph (Videos) |
|---------------------|-------------------------------------|
| **Entities:** Characters, Locations, Factions | **Entities:** Topics, Concepts, Categories, Educational Themes |
| **Scenes:** Book chapters/scenes | **Scenes:** Individual videos watched |
| **Co-appearance:** Characters appear together in scenes | **Co-appearance:** Topics appear together in videos |
| **Relationships:** Trust, alliances, family | **Relationships:** Related topics, prerequisite concepts, interest connections |
| **Temporal:** Character development across books | **Temporal:** Interest evolution over time |
| **Goal:** Understand narrative structure | **Goal:** Visualize learning journey & enable discovery |

## Key Insights to Implement

### 1. AI-Powered Entity Extraction

**From Society Map:** AI reads books and extracts named entities with fuzzy matching (92% threshold).

**For PlayPatch:**
```typescript
// Extract entities from video transcripts, descriptions, AI chats
async function extractEntitiesFromVideo(video: Video): Promise<Entity[]> {
  const sources = [
    video.transcript,
    video.description,
    video.aiConversations.flatMap(c => c.messages)
  ];

  // Use LLM to extract concepts
  const prompt = `Extract key educational concepts, topics, and themes from this
                  children's video content. Group similar terms.
                  Video: "${video.title}"
                  Transcript: ${video.transcript}

                  Return JSON: [{ name: string, type: 'topic' | 'concept', confidence: number }]`;

  const extracted = await aiService.extract(prompt);

  // Deduplicate with existing topics using fuzzy matching
  return deduplicateEntities([
    ...video.topics.map(t => ({ name: t, type: 'topic', confidence: 1.0 })),
    ...extracted
  ], 0.92); // 92% similarity threshold from Society Map
}
```

### 2. Weighted Co-Appearance Connections

**From Society Map:** Entities that appear together in scenes get connections weighted by frequency.

**For PlayPatch:**
```typescript
// Topics that appear together in watched videos get stronger connections
function calculateTopicCoAppearances(sessions: WatchSession[]): Edge[] {
  const edges: Edge[] = [];

  for (const session of sessions) {
    const video = await getVideo(session.videoId);
    const topics = await extractEntitiesFromVideo(video);

    // Weight by how much of the video the child watched
    const watchWeight = session.duration / video.duration; // 0-1

    // Every pair of topics in this video gets connected
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        edges.push({
          source: topics[i].name,
          target: topics[j].name,
          weight: watchWeight, // Stronger if they watched more
          type: 'CO_APPEARS',
          videoId: video.id
        });
      }
    }
  }

  // Aggregate edges by source+target pair
  return aggregateEdgeWeights(edges);
}

function aggregateEdgeWeights(edges: Edge[]): Edge[] {
  const aggregated = new Map<string, Edge>();

  for (const edge of edges) {
    const key = [edge.source, edge.target].sort().join('|');

    if (!aggregated.has(key)) {
      aggregated.set(key, { ...edge, weight: 0, videos: [] });
    }

    const existing = aggregated.get(key)!;
    existing.weight += edge.weight;
    existing.videos.push(edge.videoId);
  }

  return Array.from(aggregated.values());
}
```

### 3. Union-Find for Deduplication

**From Society Map:** Union-find algorithm groups similar entities (e.g., "Professor McGonagall", "McGonagall", "Minerva McGonagall").

**For PlayPatch:**
```typescript
// Group similar topic names: "Ocean", "Oceans", "The Ocean" → "Ocean"
class EntityDeduplicator {
  private unionFind = new UnionFind();
  private entities: Entity[];

  constructor(entities: Entity[]) {
    this.entities = entities;
    this.buildSimilarityGraph();
  }

  buildSimilarityGraph(): void {
    const THRESHOLD = 0.92; // From Society Map

    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const similarity = this.calculateSimilarity(
          this.entities[i].name,
          this.entities[j].name
        );

        if (similarity >= THRESHOLD) {
          this.unionFind.union(i, j);
        }
      }
    }
  }

  getDeduplicated(): Entity[] {
    const groups = this.unionFind.getGroups();

    return groups.map(indices => {
      const members = indices.map(i => this.entities[i]);

      // Pick canonical name (highest confidence or most common)
      const canonical = members.reduce((best, curr) =>
        curr.confidence > best.confidence ? curr : best
      );

      return {
        ...canonical,
        aliases: members.map(m => m.name).filter(n => n !== canonical.name),
        sources: [...new Set(members.flatMap(m => m.sources))]
      };
    });
  }

  calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein distance normalized to 0-1
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
}
```

### 4. Temporal State Tracking

**From Society Map:** Track how relationships evolve over time (trust levels, power dynamics).

**For PlayPatch:**
```typescript
// Track how child's interest in topics evolves over time
interface InterestEvolution {
  topic: string;
  timeline: Array<{
    date: Date;
    state: 'emerging' | 'growing' | 'peaked' | 'waning';
    watchTimeMinutes: number;
    videoCount: number;
    aiQuestionsCount: number;
  }>;
}

async function trackInterestEvolution(
  profileId: string
): Promise<InterestEvolution[]> {
  const sessions = await getWatchSessions(profileId);
  const topics = new Map<string, InterestEvolution>();

  // Group by week
  const weeklyData = groupByWeek(sessions);

  for (const [week, sessions] of weeklyData) {
    const topicStats = calculateTopicStats(sessions);

    for (const [topic, stats] of topicStats) {
      if (!topics.has(topic)) {
        topics.set(topic, { topic, timeline: [] });
      }

      const evolution = topics.get(topic)!;
      const prevWeek = evolution.timeline[evolution.timeline.length - 1];

      // Determine state based on trend
      let state: InterestEvolution['timeline'][0]['state'] = 'emerging';
      if (prevWeek) {
        const growth = stats.watchTime / prevWeek.watchTimeMinutes;
        if (growth > 1.5) state = 'growing';
        else if (growth > 0.8) state = 'peaked';
        else if (growth < 0.5) state = 'waning';
      }

      evolution.timeline.push({
        date: week,
        state,
        ...stats
      });
    }
  }

  return Array.from(topics.values());
}
```

### 5. WebGL Rendering for Performance

**From Society Map:** Uses WebGL for smooth rendering with hundreds of entities.

**For PlayPatch:**
```typescript
// Option 1: Use force-graph library (built on Three.js)
import ForceGraph3D from '3d-force-graph';

function renderGraph3D(container: HTMLElement, data: GraphData) {
  const graph = ForceGraph3D()(container)
    .graphData(data)
    .nodeLabel('name')
    .nodeAutoColorBy('category')
    .nodeThreeObject(node => {
      // Custom 3D objects for different entity types
      if (node.type === 'VIDEO') {
        return createVideoThumbnailSprite(node.thumbnail);
      }
      return createTopicSphere(node.size, node.color);
    })
    .linkWidth(link => link.weight * 2)
    .linkDirectionalParticles(link => link.weight > 0.5 ? 2 : 0)
    .onNodeClick(handleNodeClick);

  return graph;
}

// Option 2: Use react-force-graph for 2D (faster, simpler)
import { ForceGraph2D } from 'react-force-graph';

function KnowledgeGraph({ data }: { data: GraphData }) {
  return (
    <ForceGraph2D
      graphData={data}
      nodeCanvasObject={(node, ctx, globalScale) => {
        // Custom canvas rendering for performance
        if (node.type === 'VIDEO') {
          drawVideoNode(node, ctx, globalScale);
        } else {
          drawTopicNode(node, ctx, globalScale);
        }
      }}
      linkCanvasObjectMode={() => 'after'}
      linkCanvasObject={(link, ctx, globalScale) => {
        drawEdge(link, ctx, globalScale);
      }}
      onNodeClick={handleNodeClick}
    />
  );
}
```

### 6. Quality Control & Deduplication

**From Society Map:** Multiple deduplication phases, conflict resolution, merge entities appearing as multiple types.

**For PlayPatch:**
```typescript
// Multi-phase deduplication pipeline
class GraphQualityControl {

  // Phase 1: Remove exact duplicates
  removeDuplicates(entities: Entity[]): Entity[] {
    const seen = new Set<string>();
    return entities.filter(e => {
      const key = e.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Phase 2: Resolve alias conflicts
  resolveAliasConflicts(entities: Entity[]): Entity[] {
    const canonicalNames = new Set(entities.map(e => e.canonicalName));

    return entities.map(entity => ({
      ...entity,
      aliases: entity.aliases.filter(alias =>
        // Remove aliases that conflict with other entities' canonical names
        !canonicalNames.has(alias) || alias === entity.canonicalName
      )
    }));
  }

  // Phase 3: Merge entities appearing as multiple types
  mergeMultiTypeEntities(entities: Entity[]): Entity[] {
    const byName = new Map<string, Entity[]>();

    for (const entity of entities) {
      const key = entity.canonicalName.toLowerCase();
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(entity);
    }

    const merged: Entity[] = [];

    for (const [name, group] of byName) {
      if (group.length === 1) {
        merged.push(group[0]);
        continue;
      }

      // Multiple types - pick primary and merge
      const primary = this.choosePrimaryType(group);
      merged.push({
        ...primary,
        types: [...new Set(group.map(e => e.type))],
        sources: [...new Set(group.flatMap(e => e.sources))],
        aliases: [...new Set(group.flatMap(e => e.aliases))]
      });
    }

    return merged;
  }

  choosePrimaryType(entities: Entity[]): Entity {
    // Priority: VIDEO > TOPIC > CATEGORY > CONCEPT
    const priority = { VIDEO: 4, TOPIC: 3, CATEGORY: 2, CONCEPT: 1 };
    return entities.reduce((best, curr) =>
      priority[curr.type] > priority[best.type] ? curr : best
    );
  }

  // Phase 4: Fuzzy grouping with union-find
  fuzzyGroup(entities: Entity[]): Entity[] {
    const deduplicator = new EntityDeduplicator(entities);
    return deduplicator.getDeduplicated();
  }

  // Run full pipeline
  process(entities: Entity[]): Entity[] {
    let result = entities;
    result = this.removeDuplicates(result);
    result = this.resolveAliasConflicts(result);
    result = this.mergeMultiTypeEntities(result);
    result = this.fuzzyGroup(result);
    return result;
  }
}
```

## Implementation Phases (Updated)

### Week 1: Entity Extraction & Deduplication
- [ ] Implement AI entity extraction from transcripts
- [ ] Build fuzzy matching with 92% threshold
- [ ] Implement Union-Find algorithm
- [ ] Build quality control pipeline
- [ ] Test with sample videos

### Week 2: Graph Building & Weights
- [ ] Calculate co-appearance connections
- [ ] Implement weighted edges based on watch time
- [ ] Build temporal interest tracking
- [ ] Create graph database schema
- [ ] Background job for graph updates

### Week 3: Visualization (WebGL)
- [ ] Set up react-force-graph or 3d-force-graph
- [ ] Implement custom node rendering
- [ ] Add zoom, pan, drag interactions
- [ ] Implement node click handlers
- [ ] Performance testing with 100+ nodes

### Week 4: Polish & Discovery
- [ ] Search integration (highlight nodes)
- [ ] Filter by watched/unwatched
- [ ] Timeline view (interest evolution)
- [ ] Export graph as image
- [ ] Parent insights dashboard

## Testing Strategy

- [ ] Test entity extraction accuracy (precision/recall)
- [ ] Test deduplication with known aliases
- [ ] Test graph building with various video counts
- [ ] Performance test with 500+ videos
- [ ] Test temporal tracking accuracy
- [ ] Visual testing (graph layout quality)

## Dependencies

```json
{
  "dependencies": {
    "d3": "^7.8.5",
    "react-force-graph": "^1.44.0",
    "3d-force-graph": "^1.72.0", // Optional: 3D version
    "three": "^0.158.0", // If using 3D
    "levenshtein": "^1.0.5" // For fuzzy matching
  }
}
```

## Success Metrics

- **Entity Extraction Accuracy:** >90% precision
- **Deduplication Quality:** <5% false positives
- **Graph Build Time:** <10s for 100 videos
- **Render Performance:** 60fps with 300+ nodes
- **Discovery Success:** Children find 3+ new videos per session via graph

---

**Key Takeaway:** By adapting Society Map's proven techniques (AI extraction, fuzzy matching, weighted co-appearances, temporal tracking, WebGL rendering), we create a powerful knowledge graph for children's learning discovery.
