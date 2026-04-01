/**
 * Specificity Filter Service
 * TF-IDF based filtering to remove generic terms from topic extraction
 */

import natural from 'natural';
import { logger } from '@/lib/logger';

const TfIdf = natural.TfIdf;

/**
 * Custom stopwords for children's educational content
 * These are common in video titles/descriptions but not meaningful for graph nodes
 */
export const CHILDREN_STOPWORDS = [
  // Generic descriptors
  'fun',
  'learning',
  'educational',
  'cool',
  'awesome',
  'amazing',
  'best',
  'great',
  'super',
  'wonderful',
  'exciting',
  'fantastic',

  // Meta terms
  'kids',
  'children',
  'child',
  'toddler',
  'preschool',
  'kindergarten',
  'baby',
  'babies',

  // Content structure
  'video',
  'videos',
  'watch',
  'episode',
  'part',
  'series',
  'season',
  'show',
  'cartoon',
  'animation',

  // Filler
  'stuff',
  'things',
  'facts',
  'time',
  'day',
  'world',
  'life',

  // Common verbs
  'learn',
  'play',
  'explore',
  'discover',
  'watch',
  'see',
];

/**
 * English stopwords from natural library
 * Combined with children's content stopwords
 */
const ENGLISH_STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'up',
  'about',
  'into',
  'over',
  'after',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'i',
  'you',
  'he',
  'she',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'our',
  'their',
  'what',
  'which',
  'who',
  'when',
  'where',
  'why',
  'how',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'also',
  'now',
  'here',
  'there',
  'then',
  'once',
]);

/**
 * Combined stopwords set for efficient lookup
 */
const ALL_STOPWORDS = new Set([
  ...ENGLISH_STOPWORDS,
  ...CHILDREN_STOPWORDS.map((w) => w.toLowerCase()),
]);

/**
 * Filter out generic topics using stopword list and TF-IDF scoring
 *
 * Two-stage filtering:
 * 1. Stopword removal - instant filter for known generic terms
 * 2. TF-IDF scoring - filters topics that are too common (low information value)
 *
 * @param topics Array of topics from AI extraction
 * @param corpusSample Optional array of existing topics for TF-IDF baseline
 * @returns Filtered array of specific, meaningful topics
 */
export function filterGenericTopics(topics: string[], corpusSample: string[] = []): string[] {
  const filtered: string[] = [];

  for (const topic of topics) {
    // Tokenize topic into words
    const words = topic.toLowerCase().split(/\s+/);

    // Stage 1: Remove if ALL words are stopwords
    const meaningfulWords = words.filter((w) => !ALL_STOPWORDS.has(w));

    if (meaningfulWords.length === 0) {
      logger.debug({
        message: 'Topic filtered (all stopwords)',
        topic,
      });
      continue;
    }

    // Stage 2: TF-IDF scoring (if corpus provided)
    if (corpusSample.length > 0) {
      const tfidf = new TfIdf();

      // Add corpus documents
      for (const doc of corpusSample) {
        tfidf.addDocument(doc.toLowerCase());
      }

      // Add current topic as last document
      tfidf.addDocument(meaningfulWords.join(' '));
      const docIndex = tfidf.documents.length - 1;

      // Calculate max TF-IDF score for any word in topic
      let maxScore = 0;
      for (const word of meaningfulWords) {
        const score = tfidf.tfidf(word, docIndex);
        if (score > maxScore) maxScore = score;
      }

      // Topics with very low TF-IDF are too common (exist in many corpus docs)
      // Threshold of 0.5 is conservative - can be tuned based on false positive rate
      const SPECIFICITY_THRESHOLD = 0.5;
      if (maxScore < SPECIFICITY_THRESHOLD) {
        logger.debug({
          message: 'Topic filtered (low TF-IDF)',
          topic,
          maxScore,
          threshold: SPECIFICITY_THRESHOLD,
        });
        continue;
      }
    }

    // Topic passed all filters
    filtered.push(topic);
  }

  if (filtered.length < topics.length) {
    logger.info({
      message: 'Generic topics filtered',
      original: topics.length,
      remaining: filtered.length,
      removed: topics.filter((t) => !filtered.includes(t)),
    });
  }

  return filtered;
}

/**
 * Check if a single topic is specific enough
 * Lightweight check without TF-IDF (faster for single topics)
 */
export function isSpecificTopic(topic: string): boolean {
  const words = topic.toLowerCase().split(/\s+/);
  const meaningfulWords = words.filter((w) => !ALL_STOPWORDS.has(w));

  // Must have at least one meaningful word
  return meaningfulWords.length > 0;
}
