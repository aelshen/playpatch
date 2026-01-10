/**
 * Database queries for videos
 * SSK-036: Video CRUD Operations
 */

import { prisma } from '@/lib/db/client';
import type { Prisma } from '@prisma/client';

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

  if (params.status) {
    where.status = params.status as any;
  }

  if (params.approvalStatus) {
    where.approvalStatus = params.approvalStatus as any;
  }

  if (params.ageRating) {
    where.ageRating = params.ageRating as any;
  }

  if (params.category) {
    where.categories = {
      has: params.category,
    };
  }

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit || 20,
      skip: params.offset || 0,
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
      sourceType: data.sourceType as any,
      sourceId: data.sourceId,
      channelId: data.channelId,
      title: data.title,
      description: data.description,
      duration: data.duration,
      thumbnailPath: data.thumbnailPath,
      ageRating: (data.ageRating || 'AGE_7_PLUS') as any,
      categories: data.categories || [],
      topics: data.topics || [],
      status: (data.status || 'PENDING') as any,
      approvalStatus: 'PENDING',
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
  return await prisma.video.update({
    where: {
      id: videoId,
      familyId,
    },
    data: data as any,
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
      approvalStatus: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
      ageRating: data.ageRating as any,
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
      approvalStatus: 'REJECTED',
      rejectionReason: reason,
    },
  });
}

/**
 * Delete a video (soft delete by marking as rejected)
 */
export async function deleteVideo(videoId: string, familyId: string) {
  // TODO: Also delete files from storage
  return await prisma.video.delete({
    where: {
      id: videoId,
      familyId,
    },
  });
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
      status: status as any,
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
  additionalData?: Record<string, any>
) {
  return await prisma.video.update({
    where: { id: videoId },
    data: {
      status: status as any,
      ...additionalData,
    },
  });
}

/**
 * Search videos (basic - Meilisearch will be used for advanced)
 */
export async function searchVideos(familyId: string, query: string) {
  return await prisma.video.findMany({
    where: {
      familyId,
      approvalStatus: 'APPROVED',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
}
