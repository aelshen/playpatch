/**
 * Server Actions for Video Management
 * SSK-036: Video CRUD Operations
 */

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, getCurrentFamilyId } from '@/lib/auth/session';
import {
  createVideo,
  updateVideo,
  deleteVideo,
  approveVideo,
  rejectVideo,
} from '@/lib/db/queries/videos';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

const createVideoSchema = z.object({
  sourceUrl: z.string().url('Invalid URL'),
  sourceType: z.enum(['YOUTUBE', 'VIMEO', 'UPLOAD', 'PLEX', 'OTHER']),
  sourceId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.number().min(0),
  ageRating: z.enum(['AGE_2_PLUS', 'AGE_4_PLUS', 'AGE_7_PLUS', 'AGE_10_PLUS']).optional(),
  categories: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
});

const updateVideoSchema = z.object({
  videoId: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  ageRating: z.enum(['AGE_2_PLUS', 'AGE_4_PLUS', 'AGE_7_PLUS', 'AGE_10_PLUS']).optional(),
  categories: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const approveVideoSchema = z.object({
  videoId: z.string(),
  ageRating: z.enum(['AGE_2_PLUS', 'AGE_4_PLUS', 'AGE_7_PLUS', 'AGE_10_PLUS']),
  categories: z.array(z.string()).min(1, 'At least one category is required'),
  topics: z.array(z.string()).optional(),
});

export type VideoActionState = {
  error?: string;
  success?: boolean;
  videoId?: string;
};

/**
 * Create a new video record (manual entry)
 */
export async function createVideoAction(
  _prevState: VideoActionState | null,
  formData: FormData
): Promise<VideoActionState> {
  try {
    await getCurrentUser();
    const familyId = await getCurrentFamilyId();

    const validatedFields = createVideoSchema.safeParse({
      sourceUrl: formData.get('sourceUrl'),
      sourceType: formData.get('sourceType'),
      sourceId: formData.get('sourceId') || undefined,
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      duration: parseInt(formData.get('duration') as string) || 0,
      ageRating: formData.get('ageRating') || undefined,
      categories: formData.getAll('categories'),
      topics: formData.getAll('topics'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0]?.message || 'Validation failed',
      };
    }

    const video = await createVideo({
      familyId,
      ...validatedFields.data,
    });

    revalidatePath('/admin/content');

    return { success: true, videoId: video.id };
  } catch (error) {
    console.error('Create video error:', error);
    return {
      error: 'Failed to create video. Please try again.',
    };
  }
}

/**
 * Update video metadata
 */
export async function updateVideoAction(
  _prevState: VideoActionState | null,
  formData: FormData
): Promise<VideoActionState> {
  try {
    await getCurrentUser();
    const familyId = await getCurrentFamilyId();

    const validatedFields = updateVideoSchema.safeParse({
      videoId: formData.get('videoId'),
      title: formData.get('title'),
      description: formData.get('description'),
      ageRating: formData.get('ageRating'),
      categories: formData.getAll('categories'),
      topics: formData.getAll('topics'),
      notes: formData.get('notes'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0]?.message || 'Validation failed',
      };
    }

    const { videoId, ...data } = validatedFields.data;

    await updateVideo(videoId, familyId, data as any);

    revalidatePath('/admin/content');
    revalidatePath(`/admin/content/${videoId}`);

    return { success: true };
  } catch (error) {
    console.error('Update video error:', error);
    return {
      error: 'Failed to update video. Please try again.',
    };
  }
}

/**
 * Approve a video for viewing
 */
export async function approveVideoAction(
  _prevState: VideoActionState | null,
  formData: FormData
): Promise<VideoActionState> {
  try {
    const user = await getCurrentUser();
    const familyId = await getCurrentFamilyId();

    const validatedFields = approveVideoSchema.safeParse({
      videoId: formData.get('videoId'),
      ageRating: formData.get('ageRating'),
      categories: formData.getAll('categories'),
      topics: formData.getAll('topics'),
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.errors[0]?.message || 'Validation failed',
      };
    }

    const { videoId, ...data } = validatedFields.data;

    // Get video info to check if we need to queue download
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        sourceUrl: true,
        sourceType: true,
        localPath: true,
      },
    });

    if (!video) {
      return { error: 'Video not found' };
    }

    // Approve the video
    await approveVideo(videoId, familyId, user.id, data);

    // All supported sources (YouTube, Plex) are immediately watchable via embed/proxy
    await prisma.video.update({
      where: { id: videoId },
      data: { playbackMode: 'EMBED', status: 'READY' },
    });

    revalidatePath('/admin/content');
    revalidatePath('/admin/content/approval');

    return { success: true };
  } catch (error) {
    console.error('Approve video error:', error);
    return {
      error: 'Failed to approve video. Please try again.',
    };
  }
}

/**
 * Bulk approve multiple videos with the same age rating and categories
 */
export async function bulkApproveVideosAction(
  videoIds: string[],
  ageRating: string,
  categories: string[]
): Promise<VideoActionState & { approved?: number }> {
  try {
    const user = await getCurrentUser();
    const familyId = await getCurrentFamilyId();

    if (!videoIds.length) return { error: 'No videos selected' };

    const parsed = z.object({
      ageRating: z.enum(['AGE_2_PLUS', 'AGE_4_PLUS', 'AGE_7_PLUS', 'AGE_10_PLUS']),
      categories: z.array(z.string()).min(1),
    }).safeParse({ ageRating, categories });

    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message || 'Validation failed' };
    }

    const videos = await prisma.video.findMany({
      where: { id: { in: videoIds }, familyId, approvalStatus: 'PENDING' },
      select: { id: true, sourceType: true, sourceUrl: true, localPath: true },
    });

    const data = { ageRating: parsed.data.ageRating, categories: parsed.data.categories };

    await Promise.all(
      videos.map(async (video) => {
        await approveVideo(video.id, familyId, user.id, data);
        await prisma.video.update({
          where: { id: video.id },
          data: { playbackMode: 'EMBED', status: 'READY' },
        });
      })
    );

    revalidatePath('/admin/content');
    revalidatePath('/admin/content/approval');

    return { success: true, approved: videos.length };
  } catch (error) {
    console.error('Bulk approve error:', error);
    return { error: 'Failed to bulk approve videos. Please try again.' };
  }
}

/**
 * Reject a video
 */
export async function rejectVideoAction(
  videoId: string,
  reason: string
): Promise<VideoActionState> {
  try {
    await getCurrentUser();
    const familyId = await getCurrentFamilyId();

    await rejectVideo(videoId, familyId, reason);

    revalidatePath('/admin/content');
    revalidatePath('/admin/content/approval');

    return { success: true };
  } catch (error) {
    console.error('Reject video error:', error);
    return {
      error: 'Failed to reject video. Please try again.',
    };
  }
}

/**
 * Delete a video
 */
export async function deleteVideoAction(videoId: string): Promise<VideoActionState> {
  try {
    await getCurrentUser();
    const familyId = await getCurrentFamilyId();

    await deleteVideo(videoId, familyId);

    revalidatePath('/admin/content');

    return { success: true };
  } catch (error) {
    console.error('Delete video error:', error);
    return {
      error: 'Failed to delete video. Please try again.',
    };
  }
}
