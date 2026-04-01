/**
 * Graph Type Definitions
 * Types for knowledge graph data structures optimized for React Force Graph 2D
 */

/**
 * Node with engagement metrics and video preview
 * Used in graph responses
 */
export interface GraphNodeWithRelations {
  id: string;
  label: string;
  normalizedLabel: string;
  category: string | null;
  totalWatchTime: number;
  videoCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  // Top 3 related videos embedded for quick preview
  videos: {
    id: string;
    title: string;
    thumbnailPath: string | null;
    duration: number;
  }[];
}

/**
 * Edge with source and target node references
 * Weight determines visual thickness and force strength
 */
export interface GraphEdgeWithNodes {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  weight: number;
  metadata: EdgeMetadata | null;
}

/**
 * Edge metadata structure
 * Stored as JSON in database, typed here for safety
 */
export interface EdgeMetadata {
  // Videos that contributed to this edge
  videoIds: string[];
  // When this edge was created/strengthened
  timestamps: string[];
  // Breakdown of weight components
  weightComponents: {
    coAppearance: number; // Topics appeared in same video
    category: number; // Topics share category
    sequence: number; // Topics watched in sequence
  };
}

/**
 * Graph response format optimized for React Force Graph 2D
 * Separate nodes and edges arrays (not adjacency list)
 */
export interface GraphResponse {
  nodes: GraphNodeForVisualization[];
  edges: GraphEdgeForVisualization[];
  meta: {
    childId: string;
    nodeCount: number;
    edgeCount: number;
    cachedAt: string | null;
    queryType: 'full' | 'video' | 'category' | 'neighborhood';
  };
}

/**
 * Node format for visualization
 * Flattened structure for React Force Graph 2D consumption
 */
export interface GraphNodeForVisualization {
  id: string;
  label: string;
  category: string | null;
  // Size based on engagement (totalWatchTime)
  val: number;
  // Color will be derived from category in frontend
  // Preview videos for sidebar on click
  videos: {
    id: string;
    title: string;
    thumbnailPath: string | null;
    duration: number;
  }[];
}

/**
 * Edge format for visualization
 * Uses source/target IDs as React Force Graph expects
 */
export interface GraphEdgeForVisualization {
  source: string;
  target: string;
  // Width derived from weight
  weight: number;
}

/**
 * Cache key types for different query patterns
 */
export type GraphCacheKey =
  | `graph:child:${string}:full:${number}` // Full graph, top N nodes
  | `graph:child:${string}:video:${string}` // Video-centered
  | `graph:child:${string}:category:${string}` // Category-filtered
  | `graph:child:${string}:topic:${string}`; // Topic neighborhood

/**
 * Query parameters for different graph types
 */
export interface FullGraphParams {
  childId: string;
  limit?: number; // Default 50, max 100
}

export interface VideoGraphParams {
  childId: string;
  videoId: string;
}

export interface CategoryGraphParams {
  childId: string;
  category: string;
  limit?: number;
}

export interface TopicNeighborhoodParams {
  childId: string;
  topicId: string;
  depth?: number; // How many hops (default 1)
}
