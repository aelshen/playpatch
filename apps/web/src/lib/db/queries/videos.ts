/**
 * Database queries for videos
 * SSK-036: Video CRUD Operations
 */

import { prisma } from '@/lib/db/client';
import type { Prisma, VideoStatus, ApprovalStatus, AgeRating } from '@prisma/client';
import { VIDEO_DEFAULTS } from '@/lib/constants/video';

/**
 * Get all videos for a family with filtering
 */
export async function getVideosByFamily(params: {
  familyId: string;
  status?: string;
  approvalStatus?: string;
  ageRating?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.VideoWhereInput = {
    familyId: params.familyId,
  };

  // Type-safe status filtering
  if (params.status) {
    where.status = params.status as VideoStatus;
  }

  if (params.approvalStatus) {
    where.approvalStatus = params.approvalStatus as ApprovalStatus;
  }

  if (params.ageRating) {
    where.ageRating = params.ageRating as AgeRating;
  }

  if (params.category) {
    where.categories = {
      has: params.category,
    };
  }

  // Enforce pagination limits for security
  const limit = Math.min(
    params.limit || VIDEO_DEFAULTS.LIMIT,
    VIDEO_DEFAULTS.MAX_LIMIT
  );
  const offset = Math.max(params.offset || 0, 0);

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            thumbnailUrl: true,
          },
        },
      },
    }),
    prisma.video.count({ where }),
  ]);

  return { videos, total };
}

/**
 * Get a single video by ID
 */
export async function getVideoById(videoId: string, familyId: string) {
  return await prisma.video.findFirst({
    where: {
      id: videoId,
      familyId,
    },
    include: {
      channel: true,
      collections: {
        include: {
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Create a new video record
 */
export async function createVideo(data: {
  familyId: string;
  sourceUrl: string;
  sourceType: string;
  sourceId?: string;
  channelId?: string;
  title: string;
  description?: string;
  duration: number;
  thumbnailPath?: string;
  ageRating?: string;
  categories?: string[];
  topics?: string[];
  status?: string; // Optional: defaults to 'PENDING'
}) {
  return await prisma.video.create({
    data: {
      familyId: data.familyId,
      sourceUrl: data.sourceUrl,
      sourceType: data.sourceType as Prisma.VideoSourceType,
      sourceId: data.sourceId,
      channelId: data.channelId,
      title: data.title,
      description: data.description,
      duration: data.duration,
      thumbnailPath: data.thumbnailPath,
      ageRating: (data.ageRating || VIDEO_DEFAULTS.AGE_RATING) as AgeRating,
      categories: data.categories || [],
      topics: data.topics || [],
      status: (data.status || VIDEO_DEFAULTS.STATUS) as VideoStatus,
      approvalStatus: VIDEO_DEFAULTS.APPROVAL_STATUS as ApprovalStatus,
    },
  });
}

/**
 * Update video metadata
 */
export async function updateVideo(
  videoId: string,
  familyId: string,
  data: {
    title?: string;
    description?: string;
    ageRating?: string;
    categories?: string[];
    topics?: string[];
    notes?: string;
    status?: string;
    approvalStatus?: string;
    localPath?: string;
    hlsPath?: string;
    thumbnailPath?: string;
    transcript?: string;
    isDownloaded?: boolean;
    isTranscoded?: boolean;
    isTranscribed?: boolean;
  }
) {
  // Build type-safe update data
  const updateData: Prisma.VideoUpdateInput = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.ageRating !== undefined && { ageRating: data.ageRating as AgeRating }),
    ...(data.categories !== undefined && { categories: data.categories }),
    ...(data.topics !== undefined && { topics: data.topics }),
    ...(data.notes !== undefined && { notes: data.notes }),
    ...(data.status !== undefined && { status: data.status as VideoStatus }),
    ...(data.approvalStatus !== undefined && { approvalStatus: data.approvalStatus as ApprovalStatus }),
    ...(data.localPath !== undefined && { localPath: data.localPath }),
    ...(data.hlsPath !== undefined && { hlsPath: data.hlsPath }),
    ...(data.thumbnailPath !== undefined && { thumbnailPath: data.thumbnailPath }),
    ...(data.transcript !== undefined && { transcript: data.transcript }),
    ...(data.isDownloaded !== undefined && { isDownloaded: data.isDownloaded }),
    ...(data.isTranscoded !== undefined && { isTranscoded: data.isTranscoded }),
    ...(data.isTranscribed !== undefined && { isTranscribed: data.isTranscribed }),
  };

  return await prisma.video.update({
    where: {
      id: videoId,
      familyId,
    },
    data: updateData,
  });
}

/**
 * Approve a video
 */
export async function approveVideo(
  videoId: string,
  familyId: string,
  approvedBy: string,
  data: {
    ageRating: string;
    categories: string[];
    topics?: string[];
  }
) {
  return await prisma.video.update({
    where: {
      id: videoId,
      familyId,
    },
    data: {
      approvalStatus: 'APPROVED' as ApprovalStatus,
      approvedBy,
      approvedAt: new Date(),
      ageRating: data.ageRating as AgeRating,
      categories: data.categories,
      topics: data.topics || [],
    },
  });
}

/**
 * Reject a video
 */
export async function rejectVideo(
  videoId: string,
  familyId: string,
  reason: string
) {
  return await prisma.video.update({
    where: {
      id: videoId,
      familyId,
    },
    data: {
      approvalStatus: 'REJECTED' as ApprovalStatus,
      rejectionReason: reason,
    },
  });
}

/**
 * Delete a video and cleanup associated files
 */
export async function deleteVideo(videoId: string, familyId: string) {
  // Get video first to know what files to delete
  const video = await getVideoById(videoId, familyId);
  if (!video) {
    throw new Error('Video not found');
  }

  // Delete from database first
  const deleted = await prisma.video.delete({
    where: {
      id: videoId,
      familyId,
    },
  });

  // Then delete files from storage (errors don't rollback DB)
  // Import dynamically to avoid circular dependencies
  try {
    const { deleteFile, listFiles, BUCKETS } = await import('@/lib/storage/client');
    const { logger } = await import('@/lib/logger');

    const deletionPromises: Promise<void>[] = [];

    // Delete original video file
    if (video.localPath) {
      deletionPromises.push(
        deleteFile(BUCKETS.VIDEOS, video.localPath).catch((err) => {
          logger.error('Failed to delete video file', { videoId, path: video.localPath, error: err });
        })
      );
    }

    // Delete HLS files (playlist + segments)
    if (video.hlsPath) {
      // List all files with HLS prefix
      const hlsFiles = await listFiles(BUCKETS.VIDEOS, video.hlsPath);

      for (const file of hlsFiles) {
        deletionPromises.push(
          deleteFile(BUCKETS.VIDEOS, file).catch((err) => {
            logger.error('Failed to delete HLS file', { videoId, file, error: err });
          })
        );
      }
    }

    // Delete thumbnail
    if (video.thumbnailPath) {
      deletionPromises.push(
        deleteFile(BUCKETS.THUMBNAILS, video.thumbnailPath).catch((err) => {
          logger.error('Failed to delete thumbnail', { videoId, path: video.thumbnailPath, error: err });
        })
      );
    }

    // Wait for all deletions (continue even if some fail)
    await Promise.allSettled(deletionPromises);
  } catch (error) {
    const { logger } = await import('@/lib/logger');
    logger.error('Storage cleanup failed during video deletion', { videoId, error });
    // Don't throw - video is already deleted from DB
  }

  return deleted;
}

/**
 * Get pending approval videos
 */
export async function getPendingApprovalVideos(familyId: string) {
  return await prisma.video.findMany({
    where: {
      familyId,
      approvalStatus: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get videos by status
 */
export async function getVideosByStatus(familyId: string, status: string) {
  return await prisma.video.findMany({
    where: {
      familyId,
      status: status as VideoStatus,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update video status
 */
export async function updateVideoStatus(
  videoId: string,
  status: string,
  additionalData?: Prisma.VideoUpdateInput
) {
  return await prisma.video.update({
    where: { id: videoId },
    data: {
      status: status as VideoStatus,
      ...additionalData,
    },
  });
}

/**
 * Search videos (basic - Meilisearch will be used for advanced)
 */
export async function searchVideos(familyId: string, query: string, limit?: number) {
  // Enforce max limit for security
  const safeLimit = Math.min(limit || VIDEO_DEFAULTS.LIMIT, VIDEO_DEFAULTS.MAX_LIMIT);

  return await prisma.video.findMany({
    where: {
      familyId,
      approvalStatus: 'APPROVED' as ApprovalStatus,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: safeLimit,
    orderBy: { createdAt: 'desc' },
  });
}
