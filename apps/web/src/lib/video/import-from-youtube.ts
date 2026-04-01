/**
 * Shared helper: create a Video record from a YouTubeVideoInfo object.
 *
 * Used by:
 *  - channel-scan worker (bulk channel import)
 *  - video-import server action (single manual import)
 *
 * Idempotent: returns null when the video already exists for the family.
 */

import { prisma } from '@/lib/db/client';
import type { Channel, AgeRating, ApprovalStatus } from '@prisma/client';
import type { YouTubeVideoInfo } from '@/lib/media/youtube';
import { suggestAgeRating, mapCategories } from '@/lib/media/youtube';
import { logger } from '@/lib/logger';

export interface ImportOptions {
  approvalStatus: 'PENDING' | 'APPROVED';
  /** Override auto-suggested age rating */
  autoAgeRating?: AgeRating;
  /** Override auto-mapped categories */
  autoCategories?: string[];
}

export interface ImportResult {
  video: { id: string; title: string };
  /** Whether a download job was queued */
  queued: boolean;
}

/**
 * Import a single YouTube video into the family's library.
 *
 * Returns null if the video already exists (idempotent).
 * Approved videos get playbackMode=EMBED so they're immediately watchable.
 */
export async function importVideoFromYouTube(
  info: YouTubeVideoInfo,
  channel: Channel,
  options: ImportOptions
): Promise<ImportResult | null> {
  const { approvalStatus, autoAgeRating, autoCategories } = options;

  const existing = await prisma.video.findFirst({
    where: { familyId: channel.familyId, sourceType: 'YOUTUBE', sourceId: info.id },
    select: { id: true },
  });

  if (existing) {
    logger.debug({ videoId: info.id }, 'Video already exists, skipping import');
    return null;
  }

  const ageRating = autoAgeRating ?? (suggestAgeRating(info) as AgeRating);
  const categories =
    autoCategories && autoCategories.length > 0
      ? autoCategories
      : mapCategories(info.categories, info.tags);

  const isApproved = approvalStatus === 'APPROVED';
  const sourceUrl = `https://www.youtube.com/watch?v=${info.id}`;

  const video = await prisma.video.create({
    data: {
      familyId: channel.familyId,
      channelId: channel.id,
      sourceType: 'YOUTUBE',
      sourceId: info.id,
      sourceUrl,
      title: info.title,
      description: info.description,
      duration: info.duration,
      thumbnailPath: info.thumbnailUrl,
      ageRating,
      categories,
      topics: info.tags.slice(0, 10),
      // Approved videos are immediately watchable via embed — mark READY so child pages find them
      status: isApproved ? 'READY' : 'PENDING',
      approvalStatus: approvalStatus as ApprovalStatus,
      playbackMode: isApproved ? 'EMBED' : 'NONE',
      ...(isApproved && { approvedAt: new Date() }),
    },
  });

  logger.info(
    { videoId: video.id, title: video.title, approvalStatus, playbackMode: video.playbackMode },
    'Created video from YouTube import'
  );

  // Download is not queued — YouTube videos are watchable via embed immediately.
  // HLS transcoding can be triggered manually once reliable downloading is available.
  return { video: { id: video.id, title: video.title }, queued: false };
}
