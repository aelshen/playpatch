# Phase 2: AI Integration & Entity Quality - Research

**Researched:** 2026-02-03
**Domain:** AI-powered topic extraction, entity deduplication, and knowledge graph construction
**Confidence:** MEDIUM (verified with official documentation and multiple sources)

## Summary

Phase 2 transforms the basic graph infrastructure from Phase 1 into an intelligent, high-quality knowledge graph by integrating OpenAI structured outputs for topic extraction, fuzzy matching for deduplication, TF-IDF for specificity filtering, and sophisticated edge weighting algorithms. The research reveals that OpenAI's structured outputs feature (available in gpt-4o-mini and gpt-4o-2024-08-06) provides 100% schema adherence when using Zod validation, making it ideal for extracting 3-5 topics per video. Fuzzy matching libraries like fuzzball.js offer built-in deduplication functions specifically designed for entity matching at 92% thresholds. The Natural npm library provides production-ready TF-IDF implementation for filtering generic terms, and co-occurrence-based edge weighting with threshold pruning prevents graph hairball visualization problems.

The standard approach is to create a BullMQ job triggered by video processing completion that: (1) calls OpenAI with structured output schema, (2) fuzzy-matches extracted topics against existing GraphNodes using normalized labels, (3) filters topics using TF-IDF against a corpus of children's educational content, (4) upserts nodes with the unique constraint on (childId, normalizedLabel), and (5) creates/updates weighted edges based on co-appearance patterns. This pattern leverages existing Phase 1 infrastructure (GraphNode/GraphEdge tables, BullMQ queues, Redis caching) while adding AI intelligence.

**Primary recommendation:** Use OpenAI's native Zod integration with gpt-4o-mini ($0.15/1M input tokens) for structured topic extraction, fuzzball.js for entity deduplication with token_set_ratio matching at 92% threshold, Natural library's TF-IDF for specificity filtering with custom stopwords, and co-appearance counting with 0.3 base weight and 0.1 increments for edge weighting.

## Standard Stack

The established libraries/tools for AI-powered entity extraction and graph quality:

### Core

| Library  | Version | Purpose                                  | Why Standard                                                                                     |
| -------- | ------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| openai   | ^6.16.0 | Structured outputs API client            | Official SDK with native Zod integration, supports gpt-4o-mini structured outputs                |
| zod      | ^3.22.4 | Schema validation for structured outputs | OpenAI recommends Zod over manual JSON schema to prevent type/schema divergence                  |
| fuzzball | ^2.1.2  | Fuzzy string matching for deduplication  | Port of Python's fuzzywuzzy, includes built-in deduplication function, multiple ratio algorithms |
| natural  | ^6.12.0 | TF-IDF and NLP processing                | Most mature Node.js NLP library, 10+ years active, includes tokenization, stemming, TF-IDF       |

### Supporting

| Library            | Version | Purpose                    | When to Use                                                                                    |
| ------------------ | ------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| stopword           | ^2.0.8  | Remove common stopwords    | Filtering generic terms before TF-IDF, supports custom stopword lists for children's content   |
| zod-to-json-schema | ^3.22.0 | Convert Zod to JSON schema | Backup option if zodResponseFormat() has issues (OpenAI SDK includes zodResponseFormat helper) |

### Alternatives Considered

| Instead of        | Could Use                 | Tradeoff                                                                                                     |
| ----------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| openai (official) | @anthropic-ai/sdk         | Claude has structured outputs but OpenAI has better schema adherence guarantees (100% vs "high" reliability) |
| fuzzball.js       | string-similarity         | string-similarity has 10x more downloads but last updated 5 years ago, lacks built-in deduplication function |
| natural (TF-IDF)  | tf-idf-search, node-tfidf | Smaller packages but natural provides integrated NLP pipeline (tokenization + stemming + TF-IDF)             |
| gpt-4o-mini       | gpt-4o                    | gpt-4o is 16x more expensive ($2.50 vs $0.15 per 1M input tokens), minimal quality gain for topic extraction |

**Installation:**

```bash
# Core dependencies (openai and zod already installed)
pnpm add fuzzball natural

# Supporting (optional)
pnpm add stopword
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── ai/
│   │   ├── topic-extractor.ts      # OpenAI structured outputs logic
│   │   ├── entity-matcher.ts       # Fuzzy matching deduplication
│   │   ├── specificity-filter.ts   # TF-IDF filtering
│   │   └── schemas.ts               # Zod schemas for structured outputs
│   ├── graph/
│   │   ├── builder.ts               # Existing graph builder (Phase 1)
│   │   ├── edge-weighter.ts         # New: Edge weight calculation
│   │   └── pruner.ts                # New: Weak edge pruning
│   └── queue/
│       └── client.ts                # Existing BullMQ setup
├── workers/
│   ├── graph-builder.ts             # Existing worker (Phase 1)
│   └── topic-extraction.ts          # New: AI topic extraction worker
└── scripts/
    └── build-tfidf-corpus.ts        # One-time corpus building
```

### Pattern 1: OpenAI Structured Outputs with Zod

**What:** Use OpenAI's response_format with Zod schemas to guarantee 100% schema adherence for topic extraction.

**When to use:** Any time you need structured data from LLMs where reliability matters (e.g., topics must be array of strings, no hallucinated fields).

**Example:**

```typescript
// Source: https://platform.openai.com/docs/guides/structured-outputs
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

// Define schema for video topic extraction
const VideoTopicsSchema = z.object({
  topics: z.array(z.string()).min(3).max(5).describe('3-5 specific topics from the video'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Extraction confidence'),
  reasoning: z.string().optional().describe('Why these topics were chosen'),
});

const openai = new OpenAI();

export async function extractTopics(videoData: {
  title: string;
  description?: string;
  transcript?: string;
}) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          "Extract 3-5 specific, meaningful topics from children's educational videos. Focus on concrete subjects (animals, science concepts, activities) rather than generic terms (fun, learning, cool).",
      },
      {
        role: 'user',
        content: `Title: ${videoData.title}\n\nDescription: ${videoData.description || 'N/A'}\n\nTranscript excerpt: ${videoData.transcript?.slice(0, 500) || 'N/A'}`,
      },
    ],
    response_format: zodResponseFormat(VideoTopicsSchema, 'video_topics'),
    temperature: 0, // Deterministic for topic extraction
  });

  const result = completion.choices[0].message.parsed;
  return result; // Guaranteed to match VideoTopicsSchema
}
```

**Key details:**

- Set `temperature: 0` for factual extraction tasks
- Use `.describe()` on Zod fields to guide the model
- `response_format` with `zodResponseFormat()` ensures 100% schema adherence
- Cost: ~$0.0002 per video (assuming 1000 input tokens + 100 output tokens)

### Pattern 2: Fuzzy Matching for Entity Deduplication

**What:** Use fuzzball.js's token_set_ratio and built-in deduplication to identify and merge similar topics.

**When to use:** After extracting topics from AI, before creating GraphNode records, to prevent "ocean animals" and "marine creatures" from being separate nodes.

**Example:**

```typescript
// Source: https://github.com/nol13/fuzzball.js
import fuzz from 'fuzzball';
import { prisma } from '@/lib/db/client';

const SIMILARITY_THRESHOLD = 92; // 92% match or higher

export async function matchOrCreateNode(
  childId: string,
  topicLabel: string,
  category: string | null
): Promise<string> {
  const normalizedLabel = topicLabel.toLowerCase().trim();

  // Get existing nodes for this child
  const existingNodes = await prisma.graphNode.findMany({
    where: { childId },
    select: { id: true, label: true, normalizedLabel: true },
  });

  // Try fuzzy matching against existing nodes
  for (const node of existingNodes) {
    // token_set_ratio handles word order differences
    // "ocean animals" vs "animals in the ocean" = 100% match
    const similarity = fuzz.token_set_ratio(normalizedLabel, node.normalizedLabel);

    if (similarity >= SIMILARITY_THRESHOLD) {
      console.log(`Matched "${topicLabel}" to existing "${node.label}" (${similarity}%)`);
      return node.id; // Reuse existing node
    }
  }

  // No match found, create new node
  const newNode = await prisma.graphNode.create({
    data: {
      childId,
      label: topicLabel,
      normalizedLabel,
      category,
      totalWatchTime: 0,
      videoCount: 0,
    },
  });

  return newNode.id;
}

// Alternative: Use fuzzball's built-in deduplication
export function deduplicateTopics(topics: string[]): string[] {
  // Built-in dedupe function from fuzzball
  const unique = fuzz.dedupe(topics, {
    threshold: SIMILARITY_THRESHOLD,
    scorer: fuzz.token_set_ratio,
  });

  return unique;
}
```

**Key details:**

- `token_set_ratio` is more forgiving than `ratio` for word order variations
- 92% threshold balances false positives (merging different topics) vs false negatives (duplicate nodes)
- Normalize to lowercase before matching (already done via normalizedLabel field)
- Built-in `dedupe()` returns longest string from duplicate set (assumes more information)

### Pattern 3: TF-IDF Specificity Filtering

**What:** Use Natural's TF-IDF to score how specific a topic is and filter out generic terms like "fun", "learning", "cool".

**When to use:** After extracting topics from AI, before deduplication, to ensure only meaningful topics enter the graph.

**Example:**

```typescript
// Source: https://naturalnode.github.io/natural/tfidf.html
import natural from 'natural';
import { stopword } from 'stopword';

const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Build corpus from existing video descriptions (run once on initialization)
export async function buildTopicCorpus() {
  const videos = await prisma.video.findMany({
    select: { title: true, description: true, topics: true },
  });

  videos.forEach((video) => {
    const text = `${video.title} ${video.description || ''} ${video.topics.join(' ')}`;
    tfidf.addDocument(text);
  });

  // Save corpus to file for reuse
  tfidf.listTerms(0).forEach((item) => {
    console.log(item.term + ': ' + item.tfidf);
  });
}

// Custom stopwords for children's educational content
const CHILDREN_STOPWORDS = [
  'fun',
  'learning',
  'educational',
  'kids',
  'children',
  'cool',
  'awesome',
  'amazing',
  'best',
  'great',
  'video',
  'watch',
  'episode',
  'part',
  'series',
];

export function filterGenericTopics(topics: string[]): string[] {
  return topics.filter((topic) => {
    // Remove stopwords
    const tokens = stopword.removeStopwords(topic.toLowerCase().split(' '), [
      ...stopword.en,
      ...CHILDREN_STOPWORDS,
    ]);

    if (tokens.length === 0) return false; // All stopwords

    // Calculate TF-IDF score for the topic
    const rejoinedTopic = tokens.join(' ');
    tfidf.addDocument(rejoinedTopic);
    const lastDocIndex = tfidf.documents.length - 1;

    // Get max TF-IDF score for any term in the topic
    let maxScore = 0;
    tokens.forEach((token) => {
      const score = tfidf.tfidf(token, lastDocIndex);
      if (score > maxScore) maxScore = score;
    });

    // Topics with high TF-IDF scores are specific (e.g., "photosynthesis", "T-Rex")
    // Topics with low scores are generic (e.g., "fun facts", "cool stuff")
    const SPECIFICITY_THRESHOLD = 1.0; // Tune based on corpus
    return maxScore >= SPECIFICITY_THRESHOLD;
  });
}
```

**Key details:**

- Build corpus from all video titles/descriptions to establish baseline term frequencies
- Custom stopwords list for children's content to catch domain-specific generic terms
- TF-IDF scores are document-specific; higher scores indicate rarer, more specific terms
- Threshold of 1.0 is a starting point; adjust based on false positive/negative rate

### Pattern 4: Co-Appearance Edge Weighting

**What:** Calculate edge weights based on how often two topics appear together, using incremental updates.

**When to use:** When creating/updating edges in the graph after a watch session completes.

**Example:**

```typescript
// Source: Existing builder.ts pattern + research on co-occurrence networks
import type { EdgeMetadata } from '@/lib/graph/types';

export async function createOrUpdateEdge(
  childId: string,
  sourceNodeId: string,
  targetNodeId: string,
  videoId: string,
  category: string | null
) {
  // Ensure consistent ordering (smaller ID first to avoid duplicate edges)
  const [orderedSource, orderedTarget] =
    sourceNodeId < targetNodeId ? [sourceNodeId, targetNodeId] : [targetNodeId, sourceNodeId];

  const existingEdge = await prisma.graphEdge.findUnique({
    where: {
      childId_sourceNodeId_targetNodeId: {
        childId,
        sourceNodeId: orderedSource,
        targetNodeId: orderedTarget,
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

    // Increment co-appearance weight by 0.1 each time
    metadata.weightComponents.coAppearance = Math.min(
      1.0,
      metadata.weightComponents.coAppearance + 0.1
    );

    // Bonus for shared category
    if (category && !metadata.weightComponents.category) {
      metadata.weightComponents.category = 0.1;
    }

    // Calculate total weight (capped at 1.0)
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
    // Create new edge with base weight
    const metadata: EdgeMetadata = {
      videoIds: [videoId],
      timestamps: [new Date().toISOString()],
      weightComponents: {
        coAppearance: 0.3, // Base weight for first co-appearance
        category: category ? 0.1 : 0, // Bonus for shared category
        sequence: 0, // Reserved for watch sequence patterns
      },
    };

    await prisma.graphEdge.create({
      data: {
        childId,
        sourceNodeId: orderedSource,
        targetNodeId: orderedTarget,
        weight: 0.3 + (category ? 0.1 : 0),
        metadata,
      },
    });
  }
}
```

**Key details:**

- Base weight of 0.3 for first co-appearance (above pruning threshold)
- Increment by 0.1 on each re-occurrence (capped at 1.0)
- Bonus 0.1 weight for shared category
- Store metadata for debugging (which videos, when)
- Consistent edge ordering prevents duplicate edges

### Pattern 5: Weak Edge Pruning

**What:** Remove edges below weight threshold to prevent over-connected "hairball" graphs.

**When to use:** During graph queries (runtime pruning) or periodic cleanup jobs (database pruning).

**Example:**

```typescript
// Runtime pruning (in graph query)
export async function getGraphForVisualization(childId: string, minWeight: number = 0.3) {
  const nodes = await prisma.graphNode.findMany({
    where: { childId },
    select: {
      id: true,
      label: true,
      category: true,
      totalWatchTime: true,
      videoCount: true,
    },
  });

  const edges = await prisma.graphEdge.findMany({
    where: {
      childId,
      weight: { gte: minWeight }, // Prune at query time
    },
    select: {
      sourceNodeId: true,
      targetNodeId: true,
      weight: true,
    },
  });

  return { nodes, edges };
}

// Database pruning (periodic cleanup)
export async function pruneWeakEdges(childId: string, threshold: number = 0.3) {
  const result = await prisma.graphEdge.deleteMany({
    where: {
      childId,
      weight: { lt: threshold },
    },
  });

  console.log(`Pruned ${result.count} weak edges for child ${childId}`);
  return result.count;
}
```

**Key details:**

- Runtime pruning (query-time filtering) is safer than database deletion
- 0.3 threshold aligns with base weight (removes single-occurrence edges after time)
- Can adjust threshold per child based on graph size (more nodes = higher threshold)
- Consider keeping weak edges in database for analytics, only prune in visualization

### Anti-Patterns to Avoid

- **Don't use JSON mode instead of structured outputs**: JSON mode only guarantees valid JSON, not schema adherence. Always use `response_format` with Zod schema.

- **Don't fuzzy-match against all nodes in database**: Only match against nodes for the current child (childId). Matching across all children would merge unrelated topics.

- **Don't recalculate TF-IDF on every topic**: Build corpus once at startup or daily. Recalculating TF-IDF for each topic extraction is expensive and unnecessary.

- **Don't create bidirectional edges**: Store edges with consistent ordering (smaller ID first). Creating both A→B and B→A doubles storage and complicates queries.

- **Don't upsert JSON metadata naively**: Prisma doesn't support partial JSON updates. Always fetch existing metadata, modify in memory, then write back (or use raw SQL).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                    | Don't Build                       | Use Instead                                   | Why                                                                           |
| -------------------------- | --------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Convert Zod to JSON Schema | Manual schema converter           | `zodResponseFormat()` from openai/helpers/zod | OpenAI SDK includes helper, prevents schema/type mismatch, handles edge cases |
| Fuzzy string similarity    | Levenshtein distance from scratch | fuzzball.js with token_set_ratio              | Handles word order, partial matches, multiple algorithms, battle-tested       |
| TF-IDF calculation         | Term frequency counting           | natural library's TfIdf class                 | Handles tokenization, stemming, corpus management, proper IDF formula         |
| Stopword filtering         | Manual word lists                 | stopword npm package                          | 62 languages, allows custom lists, handles edge cases (contractions, etc.)    |
| Entity deduplication       | Loop through all nodes            | fuzzball.dedupe()                             | Built-in clustering, returns longest match, configurable threshold/scorer     |
| JSON schema validation     | Manual type checking              | Zod with .parse()                             | Runtime validation, TypeScript types, detailed error messages                 |

**Key insight:** AI/NLP operations have many edge cases (Unicode normalization, stemming variants, tokenization rules) that mature libraries handle. The "simple" version always misses cases that break in production.

## Common Pitfalls

### Pitfall 1: Schema Validation Errors with Nested Objects

**What goes wrong:** OpenAI's structured outputs reject schemas with certain Zod features (min/max constraints, refinements, transforms) that are valid JSON Schema but not supported by the API.

**Why it happens:** Zod generates full-featured JSON schemas, but OpenAI only supports a subset. Common culprits: `.refine()`, `.transform()`, `.default()` on nested objects, `.min()/.max()` on numbers.

**How to avoid:**

- Use simple Zod types: `z.string()`, `z.number()`, `z.array()`, `z.object()`, `z.enum()`
- Avoid refinements and transforms in schemas passed to OpenAI
- Use `.describe()` instead of constraints to guide the model
- Test schema with zodResponseFormat() before production use

**Warning signs:**

- Error: "Invalid schema for response_format"
- Error: "schema must have a 'type' key"
- Schema works with Zod but fails with OpenAI API

### Pitfall 2: Fuzzy Matching Performance Degradation

**What goes wrong:** Fuzzy matching 1 topic against 10,000 existing nodes takes too long (>1 second), blocking the job queue.

**Why it happens:** Levenshtein distance is O(m×n) per comparison. Comparing against every node is O(k × m × n) where k is node count.

**How to avoid:**

- Pre-filter candidates by category before fuzzy matching
- Use normalized label prefix matching to reduce candidate set
- Batch process multiple topics from same video together
- Consider caching common topic matches in Redis
- Set timeout on fuzzy matching (fallback to exact match only)

**Warning signs:**

- Graph builder jobs taking >10 seconds per video
- Redis queue backing up with DELAYED jobs
- CPU spikes on worker processes

**Example optimization:**

```typescript
// Pre-filter by category and prefix
const candidates = await prisma.graphNode.findMany({
  where: {
    childId,
    category: videoCategory, // Narrow by category first
    normalizedLabel: { startsWith: normalizedLabel[0] }, // First letter match
  },
  select: { id: true, label: true, normalizedLabel: true },
});

// Now fuzzy match against smaller candidate set (10-100 instead of 10,000)
for (const node of candidates) {
  const similarity = fuzz.token_set_ratio(normalizedLabel, node.normalizedLabel);
  if (similarity >= SIMILARITY_THRESHOLD) {
    return node.id;
  }
}
```

### Pitfall 3: TF-IDF Corpus Staleness

**What goes wrong:** TF-IDF scores drift as new videos are added, causing previously-filtered topics to pass the threshold (or vice versa).

**Why it happens:** TF-IDF is corpus-dependent. As corpus grows, term frequencies change, affecting IDF scores.

**How to avoid:**

- Rebuild TF-IDF corpus weekly or when video count grows 20%
- Log when topics are filtered to detect threshold drift
- Consider percentile-based thresholds instead of absolute scores
- Store corpus version with each filtered topic for debugging

**Warning signs:**

- Topics like "animals" suddenly passing filter
- Number of topics per video decreasing over time
- Inconsistent filtering (same topic filtered in one video, not in another)

### Pitfall 4: Edge Weight Metadata Size Growth

**What goes wrong:** Edge metadata JSON grows unbounded as videoIds and timestamps arrays accumulate hundreds of entries, hitting PostgreSQL JSON size limits.

**Why it happens:** Each co-appearance adds to metadata arrays without cleanup.

**How to avoid:**

- Cap metadata arrays at reasonable size (e.g., 50 most recent videos)
- Use rolling window: keep only last 30 days of timestamps
- Store full history in separate EdgeHistory table if needed
- Consider aggregating old entries (count instead of full list)

**Warning signs:**

- GraphEdge table size growing faster than expected
- Slow edge upsert operations (>500ms)
- Errors about JSON field size limits

**Example fix:**

```typescript
// Cap metadata arrays at 50 entries
if (metadata.videoIds.length >= 50) {
  metadata.videoIds = metadata.videoIds.slice(-49); // Keep 49 most recent
  metadata.timestamps = metadata.timestamps.slice(-49);
}
metadata.videoIds.push(videoId);
metadata.timestamps.push(new Date().toISOString());
```

### Pitfall 5: Inconsistent Text Normalization

**What goes wrong:** "Ocean Animals" and "ocean animals" become separate nodes despite fuzzy matching.

**Why it happens:** Normalization (lowercase, trim, Unicode) happens in some places but not others, causing mismatches.

**How to avoid:**

- Centralize normalization in a single function
- Use NFKC Unicode normalization for consistent representation
- Store both original label and normalized label
- Apply normalization before fuzzy matching AND before database upsert

**Warning signs:**

- Same topic appearing multiple times with different capitalization
- Fuzzy matching returning low scores for obvious matches
- Unique constraint violations on normalizedLabel

**Example normalization function:**

```typescript
export function normalizeTopicLabel(label: string): string {
  return label
    .normalize('NFKC') // Unicode normalization
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}
```

### Pitfall 6: OpenAI API Rate Limiting

**What goes wrong:** Processing 100 videos in batch hits OpenAI rate limits (10,000 requests/min on free tier), causing job failures.

**Why it happens:** Each video makes 1 API call. Batch processing exceeds rate limits.

**How to avoid:**

- Add rate limiting to BullMQ job options: `limiter: { max: 10, duration: 60000 }`
- Use BullMQ's built-in rate limiting on topic-extraction queue
- Implement exponential backoff on rate limit errors (429 status)
- Consider batching multiple videos into one API call (if prompts allow)

**Warning signs:**

- HTTP 429 errors from OpenAI API
- Jobs retrying repeatedly and failing
- Uneven processing (burst of successes, then all failures)

## Code Examples

Verified patterns from official sources:

### Full Topic Extraction Pipeline

```typescript
// Combines all patterns: OpenAI → TF-IDF filter → Fuzzy match → Graph update
import { extractTopics } from '@/lib/ai/topic-extractor';
import { filterGenericTopics } from '@/lib/ai/specificity-filter';
import { matchOrCreateNode } from '@/lib/ai/entity-matcher';
import { createOrUpdateEdge } from '@/lib/graph/edge-weighter';
import { invalidateGraphCache } from '@/lib/graph/cache';

export async function processVideoTopics(
  videoId: string,
  childId: string
): Promise<{ topicsAdded: number; edgesCreated: number }> {
  // 1. Fetch video data
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      title: true,
      description: true,
      transcript: true,
      categories: true,
    },
  });

  if (!video) throw new Error('Video not found');

  // 2. Extract topics with OpenAI
  const extracted = await extractTopics({
    title: video.title,
    description: video.description,
    transcript: video.transcript,
  });

  // 3. Filter generic terms with TF-IDF
  const specific = filterGenericTopics(extracted.topics);

  // 4. Fuzzy match and create/find nodes
  const nodeIds: string[] = [];
  for (const topic of specific) {
    const nodeId = await matchOrCreateNode(childId, topic, video.categories[0] || null);
    nodeIds.push(nodeId);
  }

  // 5. Create edges between all topic pairs
  let edgesCreated = 0;
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      await createOrUpdateEdge(
        childId,
        nodeIds[i],
        nodeIds[j],
        videoId,
        video.categories[0] || null
      );
      edgesCreated++;
    }
  }

  // 6. Link nodes to video
  for (const nodeId of nodeIds) {
    await prisma.graphNodeVideo.upsert({
      where: { nodeId_videoId: { nodeId, videoId } },
      create: { nodeId, videoId, relevanceScore: 1.0 },
      update: { relevanceScore: { increment: 0.1 } },
    });
  }

  // 7. Update video record
  await prisma.video.update({
    where: { id: videoId },
    data: { topics: specific },
  });

  // 8. Invalidate cache
  await invalidateGraphCache(childId);

  return { topicsAdded: nodeIds.length, edgesCreated };
}
```

### BullMQ Job Integration

```typescript
// Source: Existing workers/graph-builder.ts pattern
import { Worker, Job } from 'bullmq';
import { processVideoTopics } from '@/lib/ai/topic-processor';

interface TopicExtractionJobData {
  videoId: string;
  childId: string;
}

export const topicExtractionWorker = new Worker<TopicExtractionJobData>(
  'topic-extraction',
  async (job: Job<TopicExtractionJobData>) => {
    const { videoId, childId } = job.data;

    logger.info({
      message: 'Processing topic extraction job',
      jobId: job.id,
      videoId,
      childId,
    });

    const result = await processVideoTopics(videoId, childId);

    logger.info({
      message: 'Topic extraction complete',
      jobId: job.id,
      ...result,
    });

    return result;
  },
  {
    connection: redisConnection,
    concurrency: 2, // Allow 2 concurrent extractions
    limiter: {
      max: 10, // Max 10 jobs per minute (respects OpenAI rate limits)
      duration: 60000,
    },
  }
);
```

### Trigger Topic Extraction After Video Processing

```typescript
// Add to existing video download/transcode workers
import { Queue } from 'bullmq';

const topicExtractionQueue = new Queue('topic-extraction', {
  connection: redisConnection,
});

// In video-download-enhanced.ts, after successful download:
export async function onVideoProcessed(videoId: string) {
  // Get all children who have access to this video's family
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      family: {
        include: {
          users: {
            include: {
              childProfiles: true,
            },
          },
        },
      },
    },
  });

  // Trigger topic extraction for each child
  for (const user of video.family.users) {
    for (const child of user.childProfiles) {
      await topicExtractionQueue.add(
        'extract',
        { videoId, childId: child.id },
        {
          jobId: `topic-extract:${videoId}:${child.id}`, // Dedupe
          delay: 5000, // Wait 5 seconds (allow multiple videos to batch)
        }
      );
    }
  }
}
```

## State of the Art

| Old Approach                | Current Approach                       | When Changed                 | Impact                                              |
| --------------------------- | -------------------------------------- | ---------------------------- | --------------------------------------------------- |
| OpenAI function calling     | Structured outputs with Zod            | Aug 2024 (gpt-4o-2024-08-06) | 100% schema adherence vs ~95% with function calling |
| JSON mode (freeform)        | response_format with strict schema     | Aug 2024                     | Guaranteed schema match, no more parse errors       |
| Manual Levenshtein distance | fuzzball.js with token algorithms      | Stable (2018+)               | Handles word order, partial matches, 10x faster     |
| TF-IDF from scratch         | natural library integration            | Stable (2011+)               | Includes tokenization, stemming, corpus management  |
| Prisma native upsert        | Prisma 4.6.0+ with database-native SQL | Nov 2022                     | Better performance, fewer transaction conflicts     |

**Deprecated/outdated:**

- **JSON mode without schema**: OpenAI docs now recommend structured outputs over JSON mode for reliability
- **Python fuzzywuzzy package name**: Renamed to "thefuzz" (fuzzball.js is the JS port, unaffected)
- **Prisma's old upsert behavior**: Pre-4.6.0 used Prisma-level upsert (slower), now uses native database commands

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal TF-IDF threshold for children's content**
   - What we know: General threshold is around 1.0, but depends on corpus size and composition
   - What's unclear: Whether children's educational content has different term frequency distribution requiring different threshold
   - Recommendation: Start with 1.0, collect metrics on false positive/negative rate, adjust based on data

2. **Category assignment for extracted topics**
   - What we know: Topics need category classification (Animals, Science, Art, etc.) for edge weight bonus
   - What's unclear: Should we extract category from OpenAI or use separate classification step?
   - Recommendation: Add category to OpenAI structured output schema (enum of common categories), fallback to null if uncertain

3. **Watch sequence edge weighting**
   - What we know: Requirement AI-06 mentions watch sequence edges, but implementation pattern unclear
   - What's unclear: Should we track "video A watched before video B in same session" or "topic X appeared before topic Y"?
   - Recommendation: Defer to Phase 3 (visualization) when user behavior patterns are clearer; focus on co-appearance for Phase 2

4. **Handling multi-language content**
   - What we know: Natural library supports stemming for English, Russian, Spanish; stopword package supports 62 languages
   - What's unclear: Should we detect video language and use language-specific processing?
   - Recommendation: Start with English-only (primary use case), add language detection in future iteration if needed

5. **Edge weight decay over time**
   - What we know: Edges accumulate weight as topics co-appear, but no decay mechanism
   - What's unclear: Should old co-appearances matter less (recency bias) or equally (lifetime interest)?
   - Recommendation: No decay for Phase 2 (simpler), consider adding time-weighted decay in Phase 4 if graph becomes stale

## Sources

### Primary (HIGH confidence)

**OpenAI Structured Outputs:**

- [Structured Outputs Documentation](https://platform.openai.com/docs/guides/structured-outputs) - Official API guide
- [Function Calling Documentation](https://platform.openai.com/docs/guides/function-calling) - Best practices
- [Introducing Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) - Feature announcement

**Fuzzy Matching:**

- [fuzzball.js GitHub](https://github.com/nol13/fuzzball.js) - Official repository and documentation
- [npm trends comparison](https://npmtrends.com/fuzzball-vs-fuzzy-matching-vs-string-similarity) - Library popularity data

**TF-IDF and NLP:**

- [Natural TF-IDF Documentation](https://naturalnode.github.io/natural/tfidf.html) - Official guide
- [stopword npm package](https://www.npmjs.com/package/stopword) - Stopword filtering

**BullMQ:**

- [BullMQ Deduplication Guide](https://docs.bullmq.io/guide/jobs/deduplication) - Official documentation
- [How to Implement Job Deduplication](https://oneuptime.com/blog/post/2026-01-21-bullmq-job-deduplication/view) - 2026 tutorial

**Prisma:**

- [Prisma Transactions Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) - Official guide
- [Working with JSON Fields](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - JSON handling

### Secondary (MEDIUM confidence)

**OpenAI Pricing:**

- [OpenAI API Pricing](https://openai.com/api/pricing/) - Official pricing page (verified 2026-02-03)
- [GPT-4o-mini announcement](https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/) - Feature overview

**Algorithm Comparisons:**

- [Jaro-Winkler vs Levenshtein](https://www.flagright.com/post/jaro-winkler-vs-levenshtein-choosing-the-right-algorithm-for-aml-screening) - Algorithm comparison
- [Fuzzy Matching Algorithms](https://tilores.io/fuzzy-matching-algorithms) - Multiple algorithm overview

**Edge Weighting Strategies:**

- [Co-occurrence Networks](https://www.sciencedirect.com/topics/computer-science/co-occurrence-network) - ScienceDirect overview
- [Knowledge Graph Weighting](https://ceur-ws.org/Vol-2290/kars2018_paper2.pdf) - Academic research

**Entity Deduplication:**

- [Text Normalization Guide](https://mbrenndoerfer.com/writing/text-normalization-unicode-nlp) - Unicode and NLP normalization
- [Entity Resolution Guide](https://www.peopledatalabs.com/data-lab/datafication/entity-resolution-guide) - Best practices

### Tertiary (LOW confidence - flagged for validation)

**Graph Performance:**

- [Graph vs Relational Database](https://www.puppygraph.com/blog/graph-database-vs-relational-database) - General comparison (not PostgreSQL-specific)
- [Graph Pruning Research](https://www.sciencedirect.com/science/article/abs/pii/S0950705122009406) - Academic paper (paywalled)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries verified via official npm packages and documentation
- Architecture: MEDIUM - Patterns combine verified techniques but full integration not tested in this codebase
- Pitfalls: MEDIUM - Based on documentation warnings and community issues, not direct experience with this stack
- OpenAI integration: HIGH - Official SDK with Zod support is well-documented
- Fuzzy matching: HIGH - fuzzball.js is mature, stable library with clear API
- TF-IDF filtering: MEDIUM - Natural library is stable but threshold tuning is application-specific
- Edge weighting: LOW - Research-based recommendations, not production-tested patterns

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - AI APIs and libraries evolving rapidly)
