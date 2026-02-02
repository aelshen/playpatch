# Feature Spec: Interactive Knowledge Graph

**Priority:** High - Unique Differentiator
**Effort:** 2-3 weeks
**Impact:** Very High - Novel discovery mechanism

## Overview

An interactive, visual graph (inspired by "The Society Map" concept) that shows connections between concepts, topics, and videos based on what the child has watched. Similar to a "mind map" that grows as they explore content, helping them discover related videos through visual exploration rather than traditional search.

**Adapted from "Society Map"**: Instead of mapping characters/locations in books, we map topics/concepts/categories in educational videos, revealing a child's learning journey and interest clusters.

## User Story

**As a child**, I want to see how the videos I've watched are connected by topics and ideas, so I can discover new videos about things I'm curious about in a fun, visual way.

**As a parent**, I want to see my child's learning journey visualized, so I can understand how their interests are connected and growing.

## Visual Design (Based on Screenshot)

### Graph Elements

**Nodes (Circles):**
- **Videos** - Large nodes with video thumbnail
- **Topics** - Medium nodes with topic name
- **Categories** - Cluster nodes that group related content
- **Concepts** - Small nodes for specific ideas mentioned in videos

**Edges (Lines):**
- **Strength** - Line thickness = connection strength (co-occurrence frequency)
- **Type** - Line color = relationship type
  - Purple: Same category
  - Green: Related topics
  - Blue: Watch sequence (watched together)
  - Orange: AI chat connections (discussed together)

**Node Properties:**
- **Size** - Proportional to watch time or importance
- **Color** - Based on category/topic
- **Label** - Video title or topic name
- **Badge** - Icons for favorites, completed, AI chat

### Layout Types

1. **Force-Directed** (Default)
   - Natural clustering of related content
   - Interactive physics simulation
   - Drag nodes to explore

2. **Hierarchical**
   - Categories at top
   - Topics in middle
   - Videos at bottom

3. **Circular**
   - Categories around circle
   - Videos grouped by category

4. **Timeline**
   - Chronological by watch date
   - Shows learning journey

## Technical Implementation

### Database Schema Extension

```sql
-- Knowledge Graph Edges (relationships between entities)
CREATE TABLE knowledge_graph_edges (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('VIDEO', 'TOPIC', 'CATEGORY', 'CONCEPT')),
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('VIDEO', 'TOPIC', 'CATEGORY', 'CONCEPT')),
  target_id TEXT NOT NULL,
  edge_type TEXT NOT NULL CHECK (edge_type IN ('SAME_CATEGORY', 'SHARED_TOPIC', 'WATCH_SEQUENCE', 'AI_DISCUSSION', 'RECOMMENDATION')),
  weight REAL NOT NULL DEFAULT 1.0, -- Connection strength (0.0 - 1.0)
  metadata JSONB DEFAULT '{}', -- Additional context
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, source_type, source_id, target_type, target_id, edge_type)
);

CREATE INDEX idx_kg_edges_profile ON knowledge_graph_edges(profile_id);
CREATE INDEX idx_kg_edges_source ON knowledge_graph_edges(source_type, source_id);
CREATE INDEX idx_kg_edges_target ON knowledge_graph_edges(target_type, target_id);

-- Knowledge Graph Nodes (cached metadata for performance)
CREATE TABLE knowledge_graph_nodes (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('VIDEO', 'TOPIC', 'CATEGORY', 'CONCEPT')),
  entity_id TEXT NOT NULL, -- References video.id, topic name, category name, or concept name
  label TEXT NOT NULL,
  size REAL NOT NULL DEFAULT 1.0, -- Importance/watch time
  color TEXT, -- Hex color for category
  metadata JSONB DEFAULT '{}', -- Thumbnail, description, etc.
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, node_type, entity_id)
);

CREATE INDEX idx_kg_nodes_profile ON knowledge_graph_nodes(profile_id);
CREATE INDEX idx_kg_nodes_type ON knowledge_graph_nodes(node_type);
```

### API Endpoints

```typescript
// Get full knowledge graph for a profile
GET /api/profiles/[profileId]/knowledge-graph
  Query: {
    includeWatched?: boolean, // Default true
    includeUnwatched?: boolean, // Default false (for recommendations)
    minWeight?: number, // Filter weak connections (default 0.1)
    layout?: 'force' | 'hierarchical' | 'circular' | 'timeline'
  }
  Response: {
    nodes: Array<{
      id: string,
      type: 'VIDEO' | 'TOPIC' | 'CATEGORY' | 'CONCEPT',
      entityId: string,
      label: string,
      size: number,
      color: string,
      metadata: {
        thumbnail?: string,
        watched?: boolean,
        favorite?: boolean,
        watchTime?: number,
        aiChatCount?: number
      }
    }>,
    edges: Array<{
      id: string,
      source: string, // Node ID
      target: string, // Node ID
      type: 'SAME_CATEGORY' | 'SHARED_TOPIC' | 'WATCH_SEQUENCE' | 'AI_DISCUSSION' | 'RECOMMENDATION',
      weight: number
    }>,
    stats: {
      totalNodes: number,
      totalEdges: number,
      clusters: number
    }
  }

// Get graph centered on a specific video
GET /api/profiles/[profileId]/knowledge-graph/video/[videoId]
  Query: { depth?: number } // How many hops from center (default 2)
  Response: Same as above but filtered

// Get graph for a specific topic
GET /api/profiles/[profileId]/knowledge-graph/topic/[topic]
  Response: Same as above but filtered

// Update graph (triggered by watch events, AI chats, etc.)
POST /api/profiles/[profileId]/knowledge-graph/rebuild
  Response: { success: boolean, nodesProcessed: number }
```

### Entity Extraction (AI-Powered)

**Key Insight from Society Map**: Use AI to extract entities from video content (transcripts, descriptions, AI chat logs) just like Society Map extracts characters from book scenes.

```typescript
// apps/web/src/lib/knowledge-graph/entity-extractor.ts

export interface ExtractedEntity {
  name: string;
  type: 'TOPIC' | 'CONCEPT' | 'CHARACTER' | 'LOCATION';
  aliases: string[]; // Variations of the name
  canonicalName: string;
  confidence: number;
  sources: string[]; // Video IDs where mentioned
}

export async function extractEntitiesFromVideo(
  videoId: string
): Promise<ExtractedEntity[]> {
  const video = await getVideo(videoId);

  // Sources for entity extraction
  const sources = [
    video.title,
    video.description,
    video.topics, // Already tagged
    video.transcript, // If available
  ];

  // Use AI to extract additional entities from transcript
  if (video.transcript) {
    const aiExtracted = await extractWithAI(video.transcript, {
      prompt: `Extract key concepts, topics, and named entities (people, places, things)
               from this children's educational video transcript.
               Group similar terms together (e.g., "ocean", "sea", "underwater" → "Ocean").
               Return as JSON array with {name, type, confidence}.`
    });

    // Merge with existing topics
    return deduplicateEntities([
      ...video.topics.map(t => ({
        name: t,
        type: 'TOPIC',
        canonicalName: t,
        confidence: 1.0,
        aliases: [],
        sources: [videoId]
      })),
      ...aiExtracted
    ]);
  }

  return video.topics.map(t => ({
    name: t,
    type: 'TOPIC',
    canonicalName: t,
    confidence: 1.0,
    aliases: [],
    sources: [videoId]
  }));
}

/**
 * Fuzzy matching with 92% similarity threshold (from Society Map)
 * Groups variations and aliases together
 */
function deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const unionFind = new UnionFind();
  const SIMILARITY_THRESHOLD = 0.92;

  // Build similarity graph
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const similarity = stringSimilarity(
        entities[i].name.toLowerCase(),
        entities[j].name.toLowerCase()
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        unionFind.union(i, j);
      }
    }
  }

  // Merge similar entities
  const groups = unionFind.getGroups();
  return groups.map(group => {
    const members = group.map(idx => entities[idx]);
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

/**
 * Levenshtein distance similarity (0-1 scale)
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

class UnionFind {
  private parent: Map<number, number> = new Map();
  private rank: Map<number, number> = new Map();

  union(x: number, y: number): void {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return;

    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
  }

  find(x: number): number {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
    }

    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }

    return this.parent.get(x)!;
  }

  getGroups(): number[][] {
    const groups: Map<number, number[]> = new Map();

    for (const [node] of this.parent) {
      const root = this.find(node);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root)!.push(node);
    }

    return Array.from(groups.values());
  }
}
```

### Graph Building Logic

```typescript
// apps/web/src/lib/knowledge-graph/builder.ts

export async function buildKnowledgeGraph(profileId: string): Promise<void> {
  // 1. Get all watched videos for this profile
  const sessions = await getWatchSessionsForProfile(profileId);

  // 2. Extract and deduplicate entities across all videos
  const allEntities: Map<string, ExtractedEntity> = new Map();

  for (const session of sessions) {
    const video = await getVideo(session.videoId);

    // Add video node
    nodes.set(`VIDEO:${video.id}`, {
      type: 'VIDEO',
      entityId: video.id,
      label: video.title,
      size: session.duration / 3600, // Hours watched
      color: getCategoryColor(video.categories[0]),
      metadata: {
        thumbnail: video.thumbnailPath,
        watched: true,
        watchTime: session.duration
      }
    });

    // Add topic nodes
    for (const topic of video.topics) {
      const nodeId = `TOPIC:${topic}`;
      if (!nodes.has(nodeId)) {
        nodes.set(nodeId, {
          type: 'TOPIC',
          entityId: topic,
          label: topic,
          size: 0,
          color: getTopicColor(topic)
        });
      }
      // Accumulate size based on watch time
      nodes.get(nodeId)!.size += session.duration / 3600;
    }

    // Add category nodes
    for (const category of video.categories) {
      const nodeId = `CATEGORY:${category}`;
      if (!nodes.has(nodeId)) {
        nodes.set(nodeId, {
          type: 'CATEGORY',
          entityId: category,
          label: category,
          size: 0,
          color: getCategoryColor(category)
        });
      }
      nodes.get(nodeId)!.size += session.duration / 3600;
    }
  }

  // Extract entities from all watched videos
  for (const session of sessions) {
    const entities = await extractEntitiesFromVideo(session.videoId);
    for (const entity of entities) {
      const key = entity.canonicalName;
      if (!allEntities.has(key)) {
        allEntities.set(key, entity);
      } else {
        // Merge with existing entity (union sources)
        const existing = allEntities.get(key)!;
        existing.sources = [...new Set([...existing.sources, ...entity.sources])];
        existing.aliases = [...new Set([...existing.aliases, ...entity.aliases])];
      }
    }
  }

  // 3. Build edges with co-appearance weights (Society Map style)
  const edges: GraphEdge[] = [];

  // VIDEO-to-ENTITY edges (prominence weighted by watch time)
  for (const session of sessions) {
    const video = await getVideo(session.videoId);
    const videoEntities = await extractEntitiesFromVideo(video.id);

    for (const entity of videoEntities) {
      const prominence = session.duration / video.duration; // % of video watched

      edges.push({
        sourceType: 'VIDEO',
        sourceId: video.id,
        targetType: entity.type,
        targetId: entity.canonicalName,
        edgeType: 'CONTAINS',
        weight: prominence, // Higher weight = watched more of the video
        metadata: {
          watchTime: session.duration,
          prominence
        }
      });
    }
  }

  // ENTITY-to-ENTITY edges (co-appearance, weighted by frequency)
  // This is the key insight from Society Map!
  const coAppearances = calculateCoAppearances(allEntities, sessions);

  for (const [entity1, entity2, frequency] of coAppearances) {
    // Normalize frequency to 0-1 range
    const maxFrequency = Math.max(...coAppearances.map(([,,f]) => f));
    const normalizedWeight = frequency / maxFrequency;

    edges.push({
      sourceType: 'TOPIC',
      sourceId: entity1,
      targetType: 'TOPIC',
      targetId: entity2,
      edgeType: 'CO_APPEARS',
      weight: normalizedWeight,
      metadata: {
        frequency,
        commonVideos: findCommonVideos(entity1, entity2, allEntities)
      }
    });
  }

  // Watch sequence edges (temporal relationships)
  const sortedSessions = sessions.sort((a, b) =>
    a.startedAt.getTime() - b.startedAt.getTime()
  );
  for (let i = 0; i < sortedSessions.length - 1; i++) {
    const current = sortedSessions[i];
    const next = sortedSessions[i + 1];

    // Only connect if watched within same session (< 5 minutes apart)
    const timeDiff = next.startedAt.getTime() - (current.endedAt?.getTime() || current.startedAt.getTime());
    if (timeDiff < 5 * 60 * 1000) {
      edges.push({
        sourceType: 'VIDEO',
        sourceId: current.videoId,
        targetType: 'VIDEO',
        targetId: next.videoId,
        edgeType: 'WATCH_SEQUENCE',
        weight: 0.6
      });
    }
  }

  // AI chat connections
  const conversations = await getAIConversationsForProfile(profileId);
  for (const conv of conversations) {
    const messages = await getMessagesForConversation(conv.id);
    const discussedTopics = extractTopicsFromMessages(messages);

    for (const topic of discussedTopics) {
      edges.push({
        sourceType: 'VIDEO',
        sourceId: conv.videoId,
        targetType: 'TOPIC',
        targetId: topic,
        edgeType: 'AI_DISCUSSION',
        weight: 0.7
      });
    }
  }

  // 4. Save to database
  await saveGraphToDatabase(profileId, nodes, edges);
}

/**
 * Calculate co-appearances (Society Map style)
 * Entities that appear together in videos get stronger connections
 */
function calculateCoAppearances(
  entities: Map<string, ExtractedEntity>,
  sessions: WatchSession[]
): [string, string, number][] {
  const coAppearances: Map<string, number> = new Map();

  // For each video, find all entity pairs that co-appear
  for (const session of sessions) {
    const videoEntities = Array.from(entities.values())
      .filter(e => e.sources.includes(session.videoId));

    // For each pair of entities in this video
    for (let i = 0; i < videoEntities.length; i++) {
      for (let j = i + 1; j < videoEntities.length; j++) {
        const entity1 = videoEntities[i].canonicalName;
        const entity2 = videoEntities[j].canonicalName;

        // Create consistent key (alphabetically sorted)
        const key = [entity1, entity2].sort().join('|');

        // Weight by watch time (more weight if child watched longer)
        const watchWeight = session.duration / 60; // Minutes watched
        coAppearances.set(key, (coAppearances.get(key) || 0) + watchWeight);
      }
    }
  }

  // Convert to array and return
  return Array.from(coAppearances.entries()).map(([key, frequency]) => {
    const [entity1, entity2] = key.split('|');
    return [entity1, entity2, frequency];
  });
}

function findCommonVideos(
  entity1: string,
  entity2: string,
  entities: Map<string, ExtractedEntity>
): string[] {
  const e1 = entities.get(entity1);
  const e2 = entities.get(entity2);

  if (!e1 || !e2) return [];

  return e1.sources.filter(s => e2.sources.includes(s));
}

/**
 * Temporal state tracking (Society Map concept adapted for kids)
 * Track how child's interest in topics evolves over time
 */
interface TopicInterestState {
  topic: string;
  timestamp: Date;
  interestLevel: 'emerging' | 'growing' | 'strong' | 'waning';
  watchTimeMinutes: number;
  videoCount: number;
  aiChatCount: number;
}

async function trackTemporalInterestEvolution(
  profileId: string
): Promise<TopicInterestState[]> {
  const sessions = await getWatchSessionsForProfile(profileId);
  const timeline: TopicInterestState[] = [];

  // Group sessions by topic and time windows (weekly)
  const topicsByWeek = groupSessionsByTopicAndWeek(sessions);

  for (const [topic, weeks] of topicsByWeek) {
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const prevWeek = i > 0 ? weeks[i - 1] : null;

      // Calculate interest level based on trend
      let interestLevel: TopicInterestState['interestLevel'] = 'emerging';

      if (prevWeek) {
        const growth = week.watchTime / prevWeek.watchTime;
        if (growth > 1.5) interestLevel = 'growing';
        else if (growth > 1.0) interestLevel = 'strong';
        else if (growth < 0.5) interestLevel = 'waning';
        else interestLevel = 'strong';
      }

      timeline.push({
        topic,
        timestamp: week.start,
        interestLevel,
        watchTimeMinutes: week.watchTime,
        videoCount: week.videos.length,
        aiChatCount: week.aiChats || 0
      });
    }
  }

  return timeline;
}
```

### Frontend Components

```typescript
// apps/web/src/components/child/knowledge-graph/knowledge-graph.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface KnowledgeGraphProps {
  profileId: string;
  onNodeClick?: (node: GraphNode) => void;
  layout?: 'force' | 'hierarchical' | 'circular';
}

export function KnowledgeGraph({ profileId, onNodeClick, layout = 'force' }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], edges: GraphEdge[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    fetchGraphData();
  }, [profileId]);

  useEffect(() => {
    if (graphData && svgRef.current) {
      renderGraph();
    }
  }, [graphData, layout]);

  async function fetchGraphData() {
    const res = await fetch(`/api/profiles/${profileId}/knowledge-graph?layout=${layout}`);
    const data = await res.json();
    setGraphData(data);
  }

  function renderGraph() {
    if (!svgRef.current || !graphData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force('link', d3.forceLink(graphData.edges)
        .id((d: any) => d.id)
        .distance(d => 100 / (d.weight || 0.5))
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => (d as any).size * 20 + 10));

    // Create container group with zoom
    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Draw edges
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.edges)
      .join('line')
      .attr('stroke', d => getEdgeColor(d.type))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.weight * 3);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any
      );

    // Node circles
    node.append('circle')
      .attr('r', d => d.size * 20)
      .attr('fill', d => d.color)
      .attr('stroke', d => selectedNode === d.id ? '#fff' : '#ddd')
      .attr('stroke-width', d => selectedNode === d.id ? 3 : 1)
      .style('cursor', 'pointer');

    // Node labels
    node.append('text')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', d => d.size * 20 + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .style('pointer-events', 'none');

    // Node icons for videos (thumbnail or play icon)
    node.filter(d => d.type === 'VIDEO')
      .append('image')
      .attr('xlink:href', d => d.metadata?.thumbnail || '/icons/play.svg')
      .attr('x', d => -d.size * 10)
      .attr('y', d => -d.size * 10)
      .attr('width', d => d.size * 20)
      .attr('height', d => d.size * 20)
      .attr('clip-path', 'circle()')
      .style('pointer-events', 'none');

    // Click handler
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d.id);
      onNodeClick?.(d);
      highlightConnections(d.id);
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', d => `translate(${(d as any).x},${(d as any).y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    function highlightConnections(nodeId: string) {
      const connectedEdges = graphData.edges.filter(
        e => e.source === nodeId || e.target === nodeId
      );
      const connectedNodeIds = new Set(
        connectedEdges.flatMap(e => [e.source, e.target])
      );

      // Fade unconnected nodes
      node.style('opacity', d => connectedNodeIds.has(d.id) ? 1 : 0.2);
      link.style('opacity', d =>
        connectedEdges.includes(d) ? 1 : 0.1
      );
    }
  }

  function getEdgeColor(type: string): string {
    const colors = {
      SAME_CATEGORY: '#a855f7',
      SHARED_TOPIC: '#22c55e',
      WATCH_SEQUENCE: '#3b82f6',
      AI_DISCUSSION: '#f97316',
      RECOMMENDATION: '#eab308'
    };
    return colors[type] || '#94a3b8';
  }

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg">
        <div className="space-y-2">
          <button onClick={() => fetchGraphData()} className="btn-secondary">
            Refresh
          </button>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            className="select"
          >
            <option value="force">Force Layout</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="circular">Circular</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
        <h3 className="font-bold mb-2">Legend</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-purple-500" />
            <span>Same Category</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500" />
            <span>Related Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500" />
            <span>Watch Sequence</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-orange-500" />
            <span>AI Discussion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## User Interactions

### Child Mode
1. **Explore Graph**
   - Pan and zoom freely
   - Click nodes to see details
   - Double-click video node → watch video
   - Drag nodes to rearrange

2. **Discovery Flow**
   - Start from a watched video
   - See connected topics highlighted
   - Click topic → see all related videos
   - Filter by watched/unwatched

3. **Search Integration**
   - Search highlights matching nodes
   - Zoom to search results
   - "Similar videos" shows graph connections

### Parent Mode
1. **Learning Journey View**
   - See how interests evolved over time
   - Identify knowledge clusters
   - Export graph as image
   - Track topic diversity

2. **Insights**
   - "Deep dives" - topics with high density
   - "Scattered interests" - isolated nodes
   - "Learning paths" - sequential connections
   - "AI-driven discoveries" - AI chat connections

## Implementation Phases

### Phase 1: Backend (Week 1)
- [ ] Database schema
- [ ] Graph building algorithm
- [ ] API endpoints
- [ ] Background job for graph updates

### Phase 2: Frontend (Week 1-2)
- [ ] D3.js integration
- [ ] Basic force-directed layout
- [ ] Node/edge rendering
- [ ] Zoom and pan controls

### Phase 3: Interactions (Week 2)
- [ ] Click handlers
- [ ] Highlight connections
- [ ] Node detail panels
- [ ] Layout switching

### Phase 4: Polish (Week 3)
- [ ] Animations and transitions
- [ ] Search integration
- [ ] Export functionality
- [ ] Performance optimization
- [ ] Mobile responsiveness

## Performance Considerations

- **Large graphs (>500 nodes)**: Use clustering, show only top-k connections
- **Real-time updates**: Debounce graph rebuilds, update incrementally
- **Canvas vs SVG**: Switch to Canvas for >1000 nodes
- **WebGL**: Consider for very large graphs (Three.js/force-graph)

## Testing

- [ ] Unit tests for graph building logic
- [ ] Test with small graph (10 videos)
- [ ] Test with medium graph (100 videos)
- [ ] Test with large graph (500+ videos)
- [ ] Test edge weight calculations
- [ ] Test layout algorithms
- [ ] Test mobile interactions

## Dependencies

- `d3` - Graph visualization
- `d3-force` - Force-directed layout
- Optional: `react-force-graph` (wrapper) or `vis-network` (alternative)

## Future Enhancements

- **3D graph** (using Three.js)
- **VR mode** (immersive exploration)
- **AI-powered clustering** (auto-identify themes)
- **Collaborative graphs** (compare with siblings)
- **Graph animations** (show growth over time)
- **Export as interactive HTML** (share with family)

---

**Estimated Effort:** 2-3 weeks
**Priority:** High
**Dependencies:** None (can start now)
**Value:** Very High - Unique discovery mechanism
