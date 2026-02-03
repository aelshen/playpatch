/**
 * Graph Builder Service
 * Constructs knowledge graph from watch history
 */

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { invalidateGraphCache } from './cache';
import type { EdgeMetadata } from './types';

interface BuildResult {
  nodesCreated: number;
  nodesUpdated: number;
  edgesCreated: number;
  edgesUpdated: number;
  duration: number;
}

/**
 * Build or update graph from a single watch session
 * Incremental update - only processes the watched video
 */
export async function updateGraphFromWatchSession(
  childId: string,
  videoId: string,
  watchSessionId: string
): Promise<BuildResult> {
  const startTime = Date.now();
  const result: BuildResult = {
    nodesCreated: 0,
    nodesUpdated: 0,
    edgesCreated: 0,
    edgesUpdated: 0,
    duration: 0,
  };

  try {
    // Get the video with its topics
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        topics: true,
        categories: true,
        duration: true,
      },
    });

    if (!video || video.topics.length === 0) {
      logger.info({ message: 'No topics to process for video', videoId, childId });
      result.duration = Date.now() - startTime;
      return result;
    }

    // Get watch session for duration
    const watchSession = await prisma.watchSession.findUnique({
      where: { id: watchSessionId },
      select: { duration: true },
    });

    const watchDuration = watchSession?.duration || 0;

    // Process each topic
    for (const topic of video.topics) {
      const normalizedLabel = topic.toLowerCase().trim();

      // Determine category from video categories (use first one)
      const category = video.categories[0] || null;

      // Upsert node
      const node = await prisma.graphNode.upsert({
        where: {
          childId_normalizedLabel: {
            childId,
            normalizedLabel,
          },
        },
        create: {
          childId,
          label: topic,
          normalizedLabel,
          category,
          totalWatchTime: watchDuration,
          videoCount: 1,
        },
        update: {
          totalWatchTime: { increment: watchDuration },
          videoCount: { increment: 1 },
          lastSeenAt: new Date(),
        },
      });

      if (node.createdAt.getTime() === node.updatedAt.getTime()) {
        result.nodesCreated++;
      } else {
        result.nodesUpdated++;
      }

      // Link node to video
      await prisma.graphNodeVideo.upsert({
        where: {
          nodeId_videoId: {
            nodeId: node.id,
            videoId,
          },
        },
        create: {
          nodeId: node.id,
          videoId,
          relevanceScore: 1.0,
        },
        update: {
          relevanceScore: { increment: 0.1 }, // Boost relevance on re-watch
        },
      });
    }

    // Create edges between topics that co-appear in this video
    const videoTopics = video.topics;
    for (let i = 0; i < videoTopics.length; i++) {
      for (let j = i + 1; j < videoTopics.length; j++) {
        const topic1 = videoTopics[i].toLowerCase().trim();
        const topic2 = videoTopics[j].toLowerCase().trim();

        // Get node IDs
        const [node1, node2] = await Promise.all([
          prisma.graphNode.findFirst({
            where: { childId, normalizedLabel: topic1 },
            select: { id: true },
          }),
          prisma.graphNode.findFirst({
            where: { childId, normalizedLabel: topic2 },
            select: { id: true },
          }),
        ]);

        if (!node1 || !node2) continue;

        // Ensure consistent ordering (smaller ID first)
        const [sourceId, targetId] =
          node1.id < node2.id ? [node1.id, node2.id] : [node2.id, node1.id];

        // Upsert edge
        const existingEdge = await prisma.graphEdge.findUnique({
          where: {
            childId_sourceNodeId_targetNodeId: {
              childId,
              sourceNodeId: sourceId,
              targetNodeId: targetId,
            },
          },
        });

        if (existingEdge) {
          // Update existing edge
          const metadata = (existingEdge.metadata as EdgeMetadata) || {
            videoIds: [],
            timestamps: [],
            weightComponents: { coAppearance: 0, category: 0, sequence: 0 },
          };

          // Add video if not already present
          if (!metadata.videoIds.includes(videoId)) {
            metadata.videoIds.push(videoId);
          }
          metadata.timestamps.push(new Date().toISOString());
          metadata.weightComponents.coAppearance += 0.1;

          // Recalculate weight (cap at 1.0)
          const newWeight = Math.min(
            1.0,
            metadata.weightComponents.coAppearance +
              metadata.weightComponents.category +
              metadata.weightComponents.sequence
          );

          await prisma.graphEdge.update({
            where: { id: existingEdge.id },
            data: {
              weight: newWeight,
              metadata,
            },
          });

          result.edgesUpdated++;
        } else {
          // Create new edge
          const metadata: EdgeMetadata = {
            videoIds: [videoId],
            timestamps: [new Date().toISOString()],
            weightComponents: {
              coAppearance: 0.3, // Base weight for co-appearance
              category: 0,
              sequence: 0,
            },
          };

          await prisma.graphEdge.create({
            data: {
              childId,
              sourceNodeId: sourceId,
              targetNodeId: targetId,
              weight: 0.3,
              metadata,
            },
          });

          result.edgesCreated++;
        }
      }
    }

    // Invalidate cache for this child
    await invalidateGraphCache(childId);

    result.duration = Date.now() - startTime;
    logger.info({
      message: 'Graph updated from watch session',
      childId,
      videoId,
      ...result,
    });

    return result;
  } catch (error) {
    logger.error({
      message: 'updateGraphFromWatchSession error',
      childId,
      videoId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    result.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Full graph rebuild for a child
 * Processes all watch sessions to rebuild graph from scratch
 */
export async function buildGraphForChild(childId: string): Promise<BuildResult> {
  const startTime = Date.now();
  const result: BuildResult = {
    nodesCreated: 0,
    nodesUpdated: 0,
    edgesCreated: 0,
    edgesUpdated: 0,
    duration: 0,
  };

  try {
    // Delete existing graph data for clean rebuild
    await prisma.graphEdge.deleteMany({ where: { childId } });
    await prisma.graphNodeVideo.deleteMany({
      where: { node: { childId } },
    });
    await prisma.graphNode.deleteMany({ where: { childId } });

    // Get all watch sessions for this child
    const watchSessions = await prisma.watchSession.findMany({
      where: { childId },
      select: {
        id: true,
        videoId: true,
        duration: true,
      },
      orderBy: { startedAt: 'asc' },
    });

    logger.info({
      message: 'Starting full graph rebuild',
      childId,
      watchSessionCount: watchSessions.length,
    });

    // Process each session
    for (const session of watchSessions) {
      const sessionResult = await updateGraphFromWatchSession(childId, session.videoId, session.id);
      result.nodesCreated += sessionResult.nodesCreated;
      result.nodesUpdated += sessionResult.nodesUpdated;
      result.edgesCreated += sessionResult.edgesCreated;
      result.edgesUpdated += sessionResult.edgesUpdated;
    }

    // Invalidate all caches
    await invalidateGraphCache(childId);

    result.duration = Date.now() - startTime;
    logger.info({
      message: 'Full graph rebuild complete',
      childId,
      ...result,
    });

    return result;
  } catch (error) {
    logger.error({
      message: 'buildGraphForChild error',
      childId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    result.duration = Date.now() - startTime;
    return result;
  }
}
