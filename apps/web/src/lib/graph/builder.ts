/**
 * Graph Builder Service
 * Constructs knowledge graph from watch history
 */

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { invalidateGraphCache } from './cache';
import type { EdgeMetadata } from './types';
import { extractTopicsFromVideo } from '@/lib/ai/topic-extractor';
import {
  matchExistingTopic,
  normalizeTopicLabel,
  deduplicateTopics,
} from '@/lib/ai/entity-matcher';
import { filterGenericTopics } from '@/lib/ai/specificity-filter';

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
 * Process a video with AI topic extraction and graph updates
 * Full AI pipeline: extract -> filter -> dedupe -> match -> graph
 *
 * @param videoId Video to process
 * @param familyId Family scope for children lookup
 * @returns Processing result with topic and edge counts
 */
export async function processVideoWithAI(
  videoId: string,
  familyId: string
): Promise<{
  success: boolean;
  topicsExtracted: number;
  topicsAfterFilter: number;
  nodesCreated: number;
  nodesMatched: number;
  edgesCreated: number;
  error?: string;
}> {
  const result = {
    success: false,
    topicsExtracted: 0,
    topicsAfterFilter: 0,
    nodesCreated: 0,
    nodesMatched: 0,
    edgesCreated: 0,
    error: undefined as string | undefined,
  };

  try {
    // 1. Get video data
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        description: true,
        categories: true,
        topics: true, // Existing topics
        family: {
          select: {
            users: {
              select: {
                childProfiles: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!video) {
      result.error = 'Video not found';
      return result;
    }

    // 2. Extract topics with AI (if not already extracted)
    let topics: string[] = video.topics;

    if (topics.length === 0) {
      const extraction = await extractTopicsFromVideo({
        title: video.title,
        description: video.description || undefined,
      });

      if (!extraction) {
        result.error = 'AI extraction failed';
        return result;
      }

      topics = extraction.topics;
      result.topicsExtracted = topics.length;

      // Update video with extracted topics and category
      await prisma.video.update({
        where: { id: videoId },
        data: {
          topics,
          // Add AI category if video has no categories
          categories: video.categories.length === 0 ? [extraction.category] : video.categories,
        },
      });

      logger.info({
        message: 'AI topics extracted and saved',
        videoId,
        topics,
        category: extraction.category,
        confidence: extraction.confidence,
      });
    } else {
      result.topicsExtracted = topics.length;
      logger.info({
        message: 'Using existing topics',
        videoId,
        topicCount: topics.length,
      });
    }

    // 3. Filter generic topics
    const filteredTopics = filterGenericTopics(topics);
    result.topicsAfterFilter = filteredTopics.length;

    if (filteredTopics.length === 0) {
      logger.warn({
        message: 'All topics filtered out',
        videoId,
        originalTopics: topics,
      });
      result.success = true; // Not an error, just no meaningful topics
      return result;
    }

    // 4. Deduplicate within extraction batch
    const dedupedTopics = deduplicateTopics(filteredTopics);

    // 5. Get all children in this family
    const childIds: string[] = [];
    for (const user of video.family.users) {
      for (const child of user.childProfiles) {
        childIds.push(child.id);
      }
    }

    if (childIds.length === 0) {
      logger.info({ message: 'No children in family', videoId, familyId });
      result.success = true;
      return result;
    }

    // 6. For each child, create/match nodes and edges
    const category = video.categories[0] || null;

    for (const childId of childIds) {
      const nodeIds: string[] = [];

      // Process each topic
      for (const topic of dedupedTopics) {
        const normalizedLabel = normalizeTopicLabel(topic);

        // Try to match existing node
        const match = await matchExistingTopic(childId, topic, category);

        let nodeId: string;

        if (match) {
          // Use existing node
          nodeId = match.nodeId;
          result.nodesMatched++;

          // Update node metrics
          await prisma.graphNode.update({
            where: { id: nodeId },
            data: {
              videoCount: { increment: 1 },
              lastSeenAt: new Date(),
            },
          });
        } else {
          // Create new node
          const newNode = await prisma.graphNode.create({
            data: {
              childId,
              label: topic,
              normalizedLabel,
              category,
              totalWatchTime: 0,
              videoCount: 1,
            },
          });
          nodeId = newNode.id;
          result.nodesCreated++;
        }

        nodeIds.push(nodeId);

        // Link node to video
        await prisma.graphNodeVideo.upsert({
          where: { nodeId_videoId: { nodeId, videoId } },
          create: { nodeId, videoId, relevanceScore: 1.0 },
          update: { relevanceScore: { increment: 0.1 } },
        });
      }

      // 7. Create edges between co-appearing topics (with category bonus)
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const [sourceId, targetId] =
            nodeIds[i] < nodeIds[j] ? [nodeIds[i], nodeIds[j]] : [nodeIds[j], nodeIds[i]];

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
            // Update existing edge weight
            const metadata = (existingEdge.metadata as EdgeMetadata) || {
              videoIds: [],
              timestamps: [],
              weightComponents: { coAppearance: 0, category: 0, sequence: 0 },
            };

            if (!metadata.videoIds.includes(videoId)) {
              metadata.videoIds.push(videoId);
            }
            metadata.timestamps.push(new Date().toISOString());
            metadata.weightComponents.coAppearance = Math.min(
              1.0,
              metadata.weightComponents.coAppearance + 0.1
            );

            // Add category bonus if both nodes share category (AI-05)
            if (category && metadata.weightComponents.category === 0) {
              metadata.weightComponents.category = 0.1;
            }

            const newWeight = Math.min(
              1.0,
              metadata.weightComponents.coAppearance +
                metadata.weightComponents.category +
                metadata.weightComponents.sequence
            );

            await prisma.graphEdge.update({
              where: { id: existingEdge.id },
              data: { weight: newWeight, metadata },
            });
          } else {
            // Create new edge with category bonus
            const metadata: EdgeMetadata = {
              videoIds: [videoId],
              timestamps: [new Date().toISOString()],
              weightComponents: {
                coAppearance: 0.3,
                category: category ? 0.1 : 0, // Category bonus (AI-05)
                sequence: 0,
              },
            };

            await prisma.graphEdge.create({
              data: {
                childId,
                sourceNodeId: sourceId,
                targetNodeId: targetId,
                weight: 0.3 + (category ? 0.1 : 0),
                metadata,
              },
            });

            result.edgesCreated++;
          }
        }
      }

      // Invalidate cache for this child
      await invalidateGraphCache(childId);
    }

    result.success = true;
    logger.info({
      message: 'Video processed with AI',
      videoId,
      ...result,
    });

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error({
      message: 'processVideoWithAI failed',
      videoId,
      error: result.error,
    });
    return result;
  }
}

/**
 * Update sequence edges based on watch session ordering (AI-06)
 * Called after a watch session completes to strengthen edges between
 * topics that were watched in sequence.
 *
 * @param childId Child who watched the videos
 * @param sessionVideoIds Video IDs in order they were watched
 * @returns Number of edges updated
 */
export async function updateSequenceEdges(
  childId: string,
  sessionVideoIds: string[]
): Promise<number> {
  if (sessionVideoIds.length < 2) {
    return 0; // Need at least 2 videos for sequence
  }

  let edgesUpdated = 0;

  try {
    // Get topics for each video in session
    const videoTopicMap = new Map<string, string[]>();

    for (const videoId of sessionVideoIds) {
      const nodeVideos = await prisma.graphNodeVideo.findMany({
        where: { videoId },
        select: { nodeId: true },
      });

      videoTopicMap.set(
        videoId,
        nodeVideos.map((nv) => nv.nodeId)
      );
    }

    // For each consecutive pair of videos, strengthen edges between their topics
    for (let i = 0; i < sessionVideoIds.length - 1; i++) {
      const currentTopics = videoTopicMap.get(sessionVideoIds[i]) || [];
      const nextTopics = videoTopicMap.get(sessionVideoIds[i + 1]) || [];

      // Create/update edges between topics from consecutive videos
      for (const currentNodeId of currentTopics) {
        for (const nextNodeId of nextTopics) {
          if (currentNodeId === nextNodeId) continue; // Skip self-loops

          // Consistent ordering for edge lookup
          const [sourceId, targetId] =
            currentNodeId < nextNodeId ? [currentNodeId, nextNodeId] : [nextNodeId, currentNodeId];

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
            // Update sequence component
            const metadata = (existingEdge.metadata as EdgeMetadata) || {
              videoIds: [],
              timestamps: [],
              weightComponents: { coAppearance: 0, category: 0, sequence: 0 },
            };

            // Add sequence bonus (diminishing returns, max 0.3)
            metadata.weightComponents.sequence = Math.min(
              0.3,
              metadata.weightComponents.sequence + 0.05
            );

            const newWeight = Math.min(
              1.0,
              metadata.weightComponents.coAppearance +
                metadata.weightComponents.category +
                metadata.weightComponents.sequence
            );

            await prisma.graphEdge.update({
              where: { id: existingEdge.id },
              data: { weight: newWeight, metadata },
            });

            edgesUpdated++;
          } else {
            // Create new edge with sequence component only
            const metadata: EdgeMetadata = {
              videoIds: [sessionVideoIds[i], sessionVideoIds[i + 1]],
              timestamps: [new Date().toISOString()],
              weightComponents: {
                coAppearance: 0,
                category: 0,
                sequence: 0.1, // Initial sequence weight
              },
            };

            await prisma.graphEdge.create({
              data: {
                childId,
                sourceNodeId: sourceId,
                targetNodeId: targetId,
                weight: 0.1, // Sequence-only edges start weak
                metadata,
              },
            });

            edgesUpdated++;
          }
        }
      }
    }

    if (edgesUpdated > 0) {
      logger.info({
        message: 'Sequence edges updated',
        childId,
        sessionLength: sessionVideoIds.length,
        edgesUpdated,
      });

      // Invalidate cache
      await invalidateGraphCache(childId);
    }

    return edgesUpdated;
  } catch (error) {
    logger.error({
      message: 'updateSequenceEdges failed',
      childId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
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
