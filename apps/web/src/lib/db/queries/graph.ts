/**
 * Graph Database Queries
 * Queries for fetching graph data with child-scoped isolation
 */

import { prisma } from '../client';
import type {
  GraphResponse,
  GraphNodeForVisualization,
  GraphEdgeForVisualization,
  FullGraphParams,
  VideoGraphParams,
  CategoryGraphParams,
  TopicNeighborhoodParams,
} from '@/lib/graph/types';
import { logger } from '@/lib/logger';

/**
 * Transform database node to visualization format
 */
function toVisualizationNode(node: {
  id: string;
  label: string;
  category: string | null;
  totalWatchTime: number;
  videos: {
    video: {
      id: string;
      title: string;
      thumbnailPath: string | null;
      duration: number;
    };
  }[];
}): GraphNodeForVisualization {
  return {
    id: node.id,
    label: node.label,
    category: node.category,
    // Val determines node size - use log scale for watch time
    val: Math.max(1, Math.log10(node.totalWatchTime + 1) * 10),
    videos: node.videos.slice(0, 3).map((v) => ({
      id: v.video.id,
      title: v.video.title,
      thumbnailPath: v.video.thumbnailPath,
      duration: v.video.duration,
    })),
  };
}

/**
 * Transform database edge to visualization format
 */
function toVisualizationEdge(edge: {
  sourceNodeId: string;
  targetNodeId: string;
  weight: number;
}): GraphEdgeForVisualization {
  return {
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    weight: edge.weight,
  };
}

/**
 * Get full child graph with top N ranked nodes
 * Ranked by totalWatchTime (engagement)
 */
export async function getChildGraph(params: FullGraphParams): Promise<GraphResponse> {
  const { childId, limit = 50 } = params;
  const nodeLimit = Math.min(limit, 100); // Cap at 100

  try {
    // Get top nodes by engagement
    const nodes = await prisma.graphNode.findMany({
      where: { childId },
      orderBy: { totalWatchTime: 'desc' },
      take: nodeLimit,
      include: {
        videos: {
          take: 3,
          orderBy: { relevanceScore: 'desc' },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailPath: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    const nodeIds = nodes.map((n) => n.id);

    // Get edges between these nodes only
    const edges = await prisma.graphEdge.findMany({
      where: {
        childId,
        sourceNodeId: { in: nodeIds },
        targetNodeId: { in: nodeIds },
        weight: { gte: 0.3 }, // Prune weak edges
      },
      select: {
        sourceNodeId: true,
        targetNodeId: true,
        weight: true,
      },
    });

    return {
      nodes: nodes.map(toVisualizationNode),
      edges: edges.map(toVisualizationEdge),
      meta: {
        childId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        cachedAt: null,
        queryType: 'full',
      },
    };
  } catch (error) {
    logger.error({
      message: 'getChildGraph error',
      childId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Return empty graph on error
    return {
      nodes: [],
      edges: [],
      meta: { childId, nodeCount: 0, edgeCount: 0, cachedAt: null, queryType: 'full' },
    };
  }
}

/**
 * Get video-centered subgraph
 * Shows topics from a specific video and their connections
 */
export async function getVideoGraph(params: VideoGraphParams): Promise<GraphResponse> {
  const { childId, videoId } = params;

  try {
    // Get nodes connected to this video
    const videoNodes = await prisma.graphNodeVideo.findMany({
      where: {
        videoId,
        node: { childId },
      },
      include: {
        node: {
          include: {
            videos: {
              take: 3,
              orderBy: { relevanceScore: 'desc' },
              include: {
                video: {
                  select: {
                    id: true,
                    title: true,
                    thumbnailPath: true,
                    duration: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const nodes = videoNodes.map((vn) => vn.node);
    const nodeIds = nodes.map((n) => n.id);

    // Get edges between these nodes
    const edges = await prisma.graphEdge.findMany({
      where: {
        childId,
        sourceNodeId: { in: nodeIds },
        targetNodeId: { in: nodeIds },
      },
      select: {
        sourceNodeId: true,
        targetNodeId: true,
        weight: true,
      },
    });

    return {
      nodes: nodes.map(toVisualizationNode),
      edges: edges.map(toVisualizationEdge),
      meta: {
        childId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        cachedAt: null,
        queryType: 'video',
      },
    };
  } catch (error) {
    logger.error({
      message: 'getVideoGraph error',
      childId,
      videoId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      nodes: [],
      edges: [],
      meta: { childId, nodeCount: 0, edgeCount: 0, cachedAt: null, queryType: 'video' },
    };
  }
}

/**
 * Get category-filtered graph
 * Shows only nodes in specified category
 */
export async function getCategoryGraph(params: CategoryGraphParams): Promise<GraphResponse> {
  const { childId, category, limit = 50 } = params;

  try {
    const nodes = await prisma.graphNode.findMany({
      where: {
        childId,
        category,
      },
      orderBy: { totalWatchTime: 'desc' },
      take: limit,
      include: {
        videos: {
          take: 3,
          orderBy: { relevanceScore: 'desc' },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailPath: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    const nodeIds = nodes.map((n) => n.id);

    const edges = await prisma.graphEdge.findMany({
      where: {
        childId,
        sourceNodeId: { in: nodeIds },
        targetNodeId: { in: nodeIds },
      },
      select: {
        sourceNodeId: true,
        targetNodeId: true,
        weight: true,
      },
    });

    return {
      nodes: nodes.map(toVisualizationNode),
      edges: edges.map(toVisualizationEdge),
      meta: {
        childId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        cachedAt: null,
        queryType: 'category',
      },
    };
  } catch (error) {
    logger.error({
      message: 'getCategoryGraph error',
      childId,
      category,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      nodes: [],
      edges: [],
      meta: { childId, nodeCount: 0, edgeCount: 0, cachedAt: null, queryType: 'category' },
    };
  }
}

/**
 * Get topic neighborhood
 * Shows single topic with immediate neighbors (1-hop by default)
 */
export async function getTopicNeighborhood(
  params: TopicNeighborhoodParams
): Promise<GraphResponse> {
  const { childId, topicId, depth: _depth = 1 } = params;

  try {
    // Get the central node
    const centralNode = await prisma.graphNode.findFirst({
      where: { id: topicId, childId },
      include: {
        videos: {
          take: 3,
          orderBy: { relevanceScore: 'desc' },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailPath: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    if (!centralNode) {
      return {
        nodes: [],
        edges: [],
        meta: { childId, nodeCount: 0, edgeCount: 0, cachedAt: null, queryType: 'neighborhood' },
      };
    }

    // Get neighbor edges (both directions)
    const neighborEdges = await prisma.graphEdge.findMany({
      where: {
        childId,
        OR: [{ sourceNodeId: topicId }, { targetNodeId: topicId }],
      },
      select: {
        sourceNodeId: true,
        targetNodeId: true,
        weight: true,
      },
    });

    // Get neighbor node IDs
    const neighborIds = new Set<string>();
    neighborEdges.forEach((e) => {
      if (e.sourceNodeId !== topicId) neighborIds.add(e.sourceNodeId);
      if (e.targetNodeId !== topicId) neighborIds.add(e.targetNodeId);
    });

    // Fetch neighbor nodes
    const neighborNodes = await prisma.graphNode.findMany({
      where: {
        id: { in: Array.from(neighborIds) },
        childId,
      },
      include: {
        videos: {
          take: 3,
          orderBy: { relevanceScore: 'desc' },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailPath: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    const allNodes = [centralNode, ...neighborNodes];

    return {
      nodes: allNodes.map(toVisualizationNode),
      edges: neighborEdges.map(toVisualizationEdge),
      meta: {
        childId,
        nodeCount: allNodes.length,
        edgeCount: neighborEdges.length,
        cachedAt: null,
        queryType: 'neighborhood',
      },
    };
  } catch (error) {
    logger.error({
      message: 'getTopicNeighborhood error',
      childId,
      topicId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      nodes: [],
      edges: [],
      meta: { childId, nodeCount: 0, edgeCount: 0, cachedAt: null, queryType: 'neighborhood' },
    };
  }
}

/**
 * Get videos for a specific topic (full list)
 * Used for on-demand loading when user clicks topic
 */
export async function getTopicVideos(
  childId: string,
  topicId: string,
  limit: number = 20
): Promise<{ id: string; title: string; thumbnailPath: string | null; duration: number }[]> {
  try {
    const nodeVideos = await prisma.graphNodeVideo.findMany({
      where: {
        nodeId: topicId,
        node: { childId },
      },
      orderBy: { relevanceScore: 'desc' },
      take: limit,
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailPath: true,
            duration: true,
          },
        },
      },
    });

    return nodeVideos.map((nv) => nv.video);
  } catch (error) {
    logger.error({
      message: 'getTopicVideos error',
      childId,
      topicId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}
