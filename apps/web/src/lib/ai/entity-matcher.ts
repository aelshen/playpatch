/**
 * Entity Matcher Service
 * Fuzzy matching for topic deduplication using fuzzball
 */

import * as fuzz from 'fuzzball';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

/**
 * Similarity threshold for topic matching
 * 92% balances false positives (merging different topics) vs false negatives (duplicate nodes)
 * token_set_ratio handles word order differences: "ocean animals" vs "animals in ocean" = 100%
 */
const SIMILARITY_THRESHOLD = 92;

/**
 * Normalize topic label for consistent matching and storage
 * Applied before fuzzy matching AND before database operations
 */
export function normalizeTopicLabel(label: string): string {
  return label
    .normalize('NFKC') // Unicode normalization
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

/**
 * Match a topic against existing GraphNodes for a child
 *
 * Uses token_set_ratio which is forgiving of word order variations:
 * - "ocean animals" vs "animals in the ocean" = high match
 * - "sea turtles" vs "turtle" = moderate match (partial)
 *
 * @param childId Child profile ID for scoping
 * @param topicLabel The new topic to match
 * @param category Optional category to pre-filter candidates (performance optimization)
 * @returns Existing node ID if match found, null if no match
 */
export async function matchExistingTopic(
  childId: string,
  topicLabel: string,
  category?: string | null
): Promise<{ nodeId: string; matchedLabel: string; similarity: number } | null> {
  const normalizedLabel = normalizeTopicLabel(topicLabel);

  // Pre-filter candidates by category and first letter for performance
  // This reduces fuzzy matching from O(n) full scan to smaller candidate set
  const whereClause: {
    childId: string;
    category?: string;
    normalizedLabel?: { startsWith: string };
  } = { childId };

  // Only filter by category if provided
  if (category) {
    whereClause.category = category;
  }

  // First letter optimization - reduces candidate set significantly
  if (normalizedLabel.length > 0) {
    whereClause.normalizedLabel = { startsWith: normalizedLabel[0] };
  }

  const candidates = await prisma.graphNode.findMany({
    where: whereClause,
    select: {
      id: true,
      label: true,
      normalizedLabel: true,
    },
  });

  // If no candidates after category filter, try without category constraint
  let allCandidates = candidates;
  if (candidates.length === 0 && category) {
    // Retry without category - topic might match across categories
    allCandidates = await prisma.graphNode.findMany({
      where: {
        childId,
        normalizedLabel: { startsWith: normalizedLabel[0] || '' },
      },
      select: {
        id: true,
        label: true,
        normalizedLabel: true,
      },
    });
  }

  // Fuzzy match against candidates
  for (const node of allCandidates) {
    // token_set_ratio handles word order differences
    const similarity = fuzz.token_set_ratio(normalizedLabel, node.normalizedLabel);

    if (similarity >= SIMILARITY_THRESHOLD) {
      logger.info({
        message: 'Topic matched to existing node',
        newTopic: topicLabel,
        matchedTopic: node.label,
        similarity,
      });

      return {
        nodeId: node.id,
        matchedLabel: node.label,
        similarity,
      };
    }
  }

  // No match found
  return null;
}

/**
 * Deduplicate an array of topics before processing
 * Uses fuzzball's built-in dedupe function
 *
 * @param topics Array of topic strings
 * @returns Deduplicated array (keeps longest string from duplicate set)
 */
export function deduplicateTopics(topics: string[]): string[] {
  // Built-in dedupe returns array of [item, index] tuples for unique items
  const uniqueTuples = fuzz.dedupe(topics, {
    cutoff: SIMILARITY_THRESHOLD,
    scorer: fuzz.token_set_ratio,
  }) as Array<[string, number]>;

  // Extract just the unique strings
  const unique = uniqueTuples.map(([item]) => item);

  if (unique.length < topics.length) {
    logger.info({
      message: 'Topics deduplicated',
      original: topics.length,
      deduplicated: unique.length,
    });
  }

  return unique;
}
