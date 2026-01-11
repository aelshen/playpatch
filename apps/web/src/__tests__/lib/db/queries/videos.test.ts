/**
 * Unit tests for video database queries
 * Tests CRUD operations and business logic
 */

import { prismaMock } from '@/lib/__mocks__/prisma';
import {
  getVideosByFamily,
  getVideoById,
  createVideo,
  updateVideo,
  approveVideo,
  rejectVideo,
  deleteVideo,
  getPendingApprovalVideos,
  searchVideos,
} from '@/lib/db/queries/videos';
import type { Video } from '@prisma/client';

// Mock Prisma client
jest.mock('@/lib/db/client', () => ({
  prisma: prismaMock,
}));

describe('Video Database Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVideosByFamily', () => {
    it('should return videos with pagination', async () => {
      const mockVideos: Partial<Video>[] = [
        {
          id: 'video-1',
          title: 'Test Video 1',
          familyId: 'family-1',
          status: 'READY',
          approvalStatus: 'APPROVED',
        },
      ];

      prismaMock.video.findMany.mockResolvedValue(mockVideos as Video[]);
      prismaMock.video.count.mockResolvedValue(1);

      const result = await getVideosByFamily({
        familyId: 'family-1',
        limit: 20,
        offset: 0,
      });

      expect(result.videos).toEqual(mockVideos);
      expect(result.total).toBe(1);
      expect(prismaMock.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { familyId: 'family-1' },
          take: 20,
          skip: 0,
        })
      );
    });

    it('should enforce maximum pagination limit', async () => {
      prismaMock.video.findMany.mockResolvedValue([]);
      prismaMock.video.count.mockResolvedValue(0);

      await getVideosByFamily({
        familyId: 'family-1',
        limit: 999999, // Attempting to request huge limit
      });

      expect(prismaMock.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped at MAX_LIMIT
        })
      );
    });

    it('should handle negative offset by using 0', async () => {
      prismaMock.video.findMany.mockResolvedValue([]);
      prismaMock.video.count.mockResolvedValue(0);

      await getVideosByFamily({
        familyId: 'family-1',
        offset: -10,
      });

      expect(prismaMock.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // Negative offset should be 0
        })
      );
    });

    it('should filter by status', async () => {
      prismaMock.video.findMany.mockResolvedValue([]);
      prismaMock.video.count.mockResolvedValue(0);

      await getVideosByFamily({
        familyId: 'family-1',
        status: 'READY',
      });

      expect(prismaMock.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'READY',
          }),
        })
      );
    });

    it('should filter by approval status', async () => {
      prismaMock.video.findMany.mockResolvedValue([]);
      prismaMock.video.count.mockResolvedValue(0);

      await getVideosByFamily({
        familyId: 'family-1',
        approvalStatus: 'PENDING',
      });

      expect(prismaMock.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approvalStatus: 'PENDING',
          }),
        })
      );
    });

    it('should filter by age rating', async () => {
      prismaMock.video.findMany.mockResolvedValue([]);
      prismaMock.video.count.mockResolvedValue(0);

      await getVideosByFamily({
        familyId: 'family-1',
        ageRating: 'AGE_7_PLUS',
      });

      expect(prismaMock.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ageRating: 'AGE_7_PLUS',
          }),
        })
      );
    });

    it('should filter by category', async () => {
      prismaMock.video.findMany.mockResolvedValue([]);
      prismaMock.video.count.mockResolvedValue(0);

      await getVideosByFamily({
        familyId: 'family-1',
        category: 'EDUCATIONAL',
      });

      expect(prismaMock.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: { has: 'EDUCATIONAL' },
          }),
        })
      );
    });
  });

  describe('getVideoById', () => {
    it('should return video with relations', async () => {
      const mockVideo: Partial<Video> = {
        id: 'video-1',
        title: 'Test Video',
        familyId: 'family-1',
      };

      prismaMock.video.findFirst.mockResolvedValue(mockVideo as Video);

      const result = await getVideoById('video-1', 'family-1');

      expect(result).toEqual(mockVideo);
      expect(prismaMock.video.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'video-1',
          familyId: 'family-1',
        },
        include: expect.any(Object),
      });
    });

    it('should return null if video not found', async () => {
      prismaMock.video.findFirst.mockResolvedValue(null);

      const result = await getVideoById('nonexistent', 'family-1');

      expect(result).toBeNull();
    });
  });

  describe('createVideo', () => {
    it('should create video with default values', async () => {
      const videoData = {
        familyId: 'family-1',
        sourceUrl: 'https://youtube.com/watch?v=123',
        sourceType: 'YOUTUBE',
        title: 'Test Video',
        duration: 300,
      };

      const mockCreated: Partial<Video> = {
        id: 'video-1',
        ...videoData,
        status: 'PENDING',
        approvalStatus: 'PENDING',
        ageRating: 'AGE_7_PLUS',
      };

      prismaMock.video.create.mockResolvedValue(mockCreated as Video);

      const result = await createVideo(videoData);

      expect(result.status).toBe('PENDING');
      expect(result.approvalStatus).toBe('PENDING');
      expect(result.ageRating).toBe('AGE_7_PLUS');
      expect(prismaMock.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...videoData,
          status: 'PENDING',
          approvalStatus: 'PENDING',
        }),
      });
    });

    it('should create video with custom age rating', async () => {
      const videoData = {
        familyId: 'family-1',
        sourceUrl: 'https://youtube.com/watch?v=123',
        sourceType: 'YOUTUBE',
        title: 'Test Video',
        duration: 300,
        ageRating: 'AGE_10_PLUS',
      };

      prismaMock.video.create.mockResolvedValue({ id: 'video-1' } as Video);

      await createVideo(videoData);

      expect(prismaMock.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ageRating: 'AGE_10_PLUS',
        }),
      });
    });

    it('should create video with categories and topics', async () => {
      const videoData = {
        familyId: 'family-1',
        sourceUrl: 'https://youtube.com/watch?v=123',
        sourceType: 'YOUTUBE',
        title: 'Test Video',
        duration: 300,
        categories: ['EDUCATIONAL', 'SCIENCE'],
        topics: ['space', 'astronomy'],
      };

      prismaMock.video.create.mockResolvedValue({ id: 'video-1' } as Video);

      await createVideo(videoData);

      expect(prismaMock.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categories: ['EDUCATIONAL', 'SCIENCE'],
          topics: ['space', 'astronomy'],
        }),
      });
    });
  });

  describe('updateVideo', () => {
    it('should update video title', async () => {
      const mockUpdated: Partial<Video> = {
        id: 'video-1',
        title: 'Updated Title',
      };

      prismaMock.video.update.mockResolvedValue(mockUpdated as Video);

      const result = await updateVideo('video-1', 'family-1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(prismaMock.video.update).toHaveBeenCalledWith({
        where: { id: 'video-1', familyId: 'family-1' },
        data: expect.objectContaining({
          title: 'Updated Title',
        }),
      });
    });

    it('should update video status', async () => {
      prismaMock.video.update.mockResolvedValue({ id: 'video-1' } as Video);

      await updateVideo('video-1', 'family-1', {
        status: 'READY',
      });

      expect(prismaMock.video.update).toHaveBeenCalledWith({
        where: { id: 'video-1', familyId: 'family-1' },
        data: expect.objectContaining({
          status: 'READY',
        }),
      });
    });

    it('should only include defined fields in update', async () => {
      prismaMock.video.update.mockResolvedValue({ id: 'video-1' } as Video);

      await updateVideo('video-1', 'family-1', {
        title: 'New Title',
        // Other fields undefined - should not be included
      });

      const callArgs = prismaMock.video.update.mock.calls[0][0];
      expect(callArgs.data).toHaveProperty('title');
      expect(callArgs.data).not.toHaveProperty('description');
    });
  });

  describe('approveVideo', () => {
    it('should approve video with metadata', async () => {
      const mockApproved: Partial<Video> = {
        id: 'video-1',
        approvalStatus: 'APPROVED',
        ageRating: 'AGE_7_PLUS',
        categories: ['EDUCATIONAL'],
      };

      prismaMock.video.update.mockResolvedValue(mockApproved as Video);

      const result = await approveVideo('video-1', 'family-1', 'user-1', {
        ageRating: 'AGE_7_PLUS',
        categories: ['EDUCATIONAL'],
      });

      expect(result.approvalStatus).toBe('APPROVED');
      expect(prismaMock.video.update).toHaveBeenCalledWith({
        where: { id: 'video-1', familyId: 'family-1' },
        data: expect.objectContaining({
          approvalStatus: 'APPROVED',
          approvedBy: 'user-1',
          approvedAt: expect.any(Date),
          ageRating: 'AGE_7_PLUS',
          categories: ['EDUCATIONAL'],
        }),
      });
    });
  });

  describe('rejectVideo', () => {
    it('should reject video with reason', async () => {
      const mockRejected: Partial<Video> = {
        id: 'video-1',
        approvalStatus: 'REJECTED',
        rejectionReason: 'Inappropriate content',
      };

      prismaMock.video.update.mockResolvedValue(mockRejected as Video);

      const result = await rejectVideo('video-1', 'family-1', 'Inappropriate content');

      expect(result.approvalStatus).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Inappropriate content');
      expect(prismaMock.video.update).toHaveBeenCalledWith({
        where: { id: 'video-1', familyId: 'family-1' },
        data: {
          approvalStatus: 'REJECTED',
          rejectionReason: 'Inappropriate content',
        },
      });
    });
  });

  describe('deleteVideo', () => {
    it('should delete video and cleanup files', async () => {
      const mockVideo: Partial<Video> = {
        id: 'video-1',
        familyId: 'family-1',
        localPath: 'videos/video-1.mp4',
        hlsPath: 'videos/video-1',
        thumbnailPath: 'thumbnails/video-1.jpg',
      };

      prismaMock.video.findFirst.mockResolvedValue(mockVideo as Video);
      prismaMock.video.delete.mockResolvedValue({ id: 'video-1' } as Video);

      // Mock storage functions
      jest.mock('@/lib/storage/client', () => ({
        deleteFile: jest.fn().mockResolvedValue(undefined),
        listFiles: jest.fn().mockResolvedValue(['video-1/master.m3u8', 'video-1/segment1.ts']),
        BUCKETS: {
          VIDEOS: 'videos',
          THUMBNAILS: 'thumbnails',
        },
      }));

      await deleteVideo('video-1', 'family-1');

      expect(prismaMock.video.delete).toHaveBeenCalledWith({
        where: { id: 'video-1', familyId: 'family-1' },
      });
    });

    it('should throw error if video not found', async () => {
      prismaMock.video.findFirst.mockResolvedValue(null);

      await expect(deleteVideo('nonexistent', 'family-1')).rejects.toThrow('Video not found');
    });
  });

  describe('getPendingApprovalVideos', () => {
    it('should return only pending videos', async () => {
      const mockVideos: Partial<Video>[] = [
        {
          id: 'video-1',
          approvalStatus: 'PENDING',
          familyId: 'family-1',
        },
        {
          id: 'video-2',
          approvalStatus: 'PENDING',
          familyId: 'family-1',
        },
      ];

      prismaMock.video.findMany.mockResolvedValue(mockVideos as Video[]);

      const result = await getPendingApprovalVideos('family-1');

      expect(result).toHaveLength(2);
      expect(prismaMock.video.findMany).toHaveBeenCalledWith({
        where: {
          familyId: 'family-1',
          approvalStatus: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('searchVideos', () => {
    it('should search videos by title', async () => {
      prismaMock.video.findMany.mockResolvedValue([]);

      await searchVideos('family-1', 'space');

      expect(prismaMock.video.findMany).toHaveBeenCalledWith({
        where: {
          familyId: 'family-1',
          approvalStatus: 'APPROVED',
          OR: [
            { title: { contains: 'space', mode: 'insensitive' } },
            { description: { contains: 'space', mode: 'insensitive' } },
          ],
        },
        take: expect.any(Number),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should enforce maximum search limit', async () => {
      prismaMock.video.findMany.mockResolvedValue([]);

      await searchVideos('family-1', 'test', 9999);

      expect(prismaMock.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped
        })
      );
    });

    it('should only search approved videos', async () => {
      prismaMock.video.findMany.mockResolvedValue([]);

      await searchVideos('family-1', 'test');

      expect(prismaMock.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approvalStatus: 'APPROVED',
          }),
        })
      );
    });
  });
});
