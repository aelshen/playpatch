/**
 * Child Interest Query Functions
 * Merges chat curiosity signals and watch engagement signals
 * to produce a ranked list of topics a child is curious about.
 */

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { getTopicsDiscussed } from '@/lib/db/queries/ai-analytics';

export interface ChildInterest {
  topic: string;           // display name (prefer GraphNode.label if available, else chat topic name)
  score: number;           // 0–1 combined score
  sources: ('chat' | 'watch')[];
  chatCount?: number;
  watchTimeSecs?: number;
}

export async function getChildInterests(params: {
  childId: string;
  familyId: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<ChildInterest[]> {
  const { childId, familyId } = params;

  const endDate = params.endDate ?? new Date();
  const startDate = params.startDate ?? (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  })();

  logger.info({ childId, familyId }, 'Computing child interests');

  // Signal 1: Chat curiosity — topics discussed in AI conversations
  const chatTopics = await getTopicsDiscussed({
    childId,
    familyId,
    startDate,
    endDate,
    limit: 20,
  });

  // Signal 2: Watch engagement — top graph nodes by total watch time
  const watchNodes = await prisma.graphNode.findMany({
    where: { childId },
    orderBy: { totalWatchTime: 'desc' },
    take: 20,
    select: {
      label: true,
      normalizedLabel: true,
      totalWatchTime: true,
    },
  });

  // Build a unified map keyed by normalizedLabel
  interface MergedEntry {
    displayLabel: string;         // prefer GraphNode.label, fall back to chat name
    normalizedLabel: string;
    chatRank?: number;            // 0–1, 1.0 = top
    watchRank?: number;           // 0–1, 1.0 = top
    chatCount?: number;
    watchTimeSecs?: number;
  }

  const merged = new Map<string, MergedEntry>();

  const chatTotal = chatTopics.length;
  chatTopics.forEach((topic, index) => {
    const key = topic.name.toLowerCase();
    const chatRank = chatTotal > 1 ? 1 - index / (chatTotal - 1) : 1;
    merged.set(key, {
      displayLabel: topic.name,
      normalizedLabel: key,
      chatRank,
      chatCount: topic.count,
    });
  });

  const watchTotal = watchNodes.length;
  watchNodes.forEach((node, index) => {
    const key = node.normalizedLabel;
    const watchRank = watchTotal > 1 ? 1 - index / (watchTotal - 1) : 1;
    const existing = merged.get(key);
    if (existing) {
      existing.displayLabel = node.label; // prefer GraphNode label when available
      existing.watchRank = watchRank;
      existing.watchTimeSecs = node.totalWatchTime;
    } else {
      merged.set(key, {
        displayLabel: node.label,
        normalizedLabel: key,
        watchRank,
        watchTimeSecs: node.totalWatchTime,
      });
    }
  });

  // Score each entry and build result list
  const scored: ChildInterest[] = [];

  for (const entry of merged.values()) {
    const hasChat = entry.chatRank !== undefined;
    const hasWatch = entry.watchRank !== undefined;

    let score: number;
    if (hasChat && hasWatch) {
      score = entry.chatRank! * 0.6 + entry.watchRank! * 0.4;
    } else if (hasChat) {
      score = entry.chatRank! * 0.6;
    } else {
      score = entry.watchRank! * 0.4;
    }

    const sources: ('chat' | 'watch')[] = [];
    if (hasChat) sources.push('chat');
    if (hasWatch) sources.push('watch');

    scored.push({
      topic: entry.displayLabel,
      score,
      sources,
      ...(hasChat && { chatCount: entry.chatCount }),
      ...(hasWatch && { watchTimeSecs: entry.watchTimeSecs }),
    });
  }

  // Sort descending by score, return top 10
  scored.sort((a, b) => b.score - a.score);
  const result = scored.slice(0, 10);

  logger.info({ childId, interestCount: result.length }, 'Child interests computed');

  return result;
}
