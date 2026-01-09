/**
 * Meilisearch Client
 * SSK-007: Meilisearch Integration
 */

import { MeiliSearch, Index } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_KEY || 'master_key_change_me',
});

export const INDEXES = {
  VIDEOS: 'videos',
  TRANSCRIPTS: 'transcripts',
} as const;

/**
 * Initialize search indexes
 */
export async function initializeIndexes() {
  // Videos index
  const videosIndex = client.index(INDEXES.VIDEOS);

  await videosIndex.updateSettings({
    searchableAttributes: ['title', 'description', 'topics', 'categories'],
    filterableAttributes: ['ageRating', 'categories', 'topics', 'approvalStatus', 'familyId'],
    sortableAttributes: ['createdAt', 'duration', 'title'],
    displayedAttributes: [
      'id',
      'title',
      'description',
      'thumbnailPath',
      'duration',
      'ageRating',
      'categories',
      'topics',
    ],
  });

  console.log('Meilisearch indexes initialized');
}

/**
 * Index a video
 */
export async function indexVideo(video: {
  id: string;
  familyId: string;
  title: string;
  description?: string | null;
  ageRating: string;
  categories: string[];
  topics: string[];
  duration: number;
  thumbnailPath?: string | null;
  approvalStatus: string;
  createdAt: Date;
}) {
  const videosIndex = client.index(INDEXES.VIDEOS);
  await videosIndex.addDocuments([
    {
      ...video,
      createdAt: video.createdAt.getTime(),
    },
  ]);
}

/**
 * Update indexed video
 */
export async function updateVideo(
  videoId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const videosIndex = client.index(INDEXES.VIDEOS);
  await videosIndex.updateDocuments([{ id: videoId, ...updates }]);
}

/**
 * Remove video from index
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const videosIndex = client.index(INDEXES.VIDEOS);
  await videosIndex.deleteDocument(videoId);
}

/**
 * Search videos
 */
export async function searchVideos(params: {
  query: string;
  familyId: string;
  ageRating?: string;
  categories?: string[];
  limit?: number;
  offset?: number;
}) {
  const videosIndex = client.index(INDEXES.VIDEOS);

  const filters: string[] = [
    `familyId = "${params.familyId}"`,
    'approvalStatus = "APPROVED"',
  ];

  if (params.ageRating) {
    filters.push(`ageRating = "${params.ageRating}"`);
  }

  if (params.categories && params.categories.length > 0) {
    const categoryFilter = params.categories.map((c) => `categories = "${c}"`).join(' OR ');
    filters.push(`(${categoryFilter})`);
  }

  return await videosIndex.search(params.query, {
    filter: filters.join(' AND '),
    limit: params.limit || 20,
    offset: params.offset || 0,
  });
}

/**
 * Reindex all videos
 */
export async function reindexVideos(videos: any[]): Promise<void> {
  const videosIndex = client.index(INDEXES.VIDEOS);
  await videosIndex.deleteAllDocuments();
  await videosIndex.addDocuments(
    videos.map((v) => ({
      ...v,
      createdAt: v.createdAt.getTime(),
    }))
  );
}

export { client as meiliSearchClient };
export default client;
