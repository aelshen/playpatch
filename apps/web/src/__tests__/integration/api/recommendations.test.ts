/**
 * Tests for Recommendations API
 */

import { GET } from '@/app/api/recommendations/[videoId]/route';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/lib/__mocks__/prisma';

// Mock the recommendation engine
jest.mock('@/lib/recommendations/engine', () => ({
  getRecommendedVideos: jest.fn(),
}));

import { getRecommendedVideos } from '@/lib/recommendations/engine';

describe('GET /api/recommendations/[videoId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockChildProfile = {
    id: 'child-1',
    familyId: 'family-1',
  };

  const mockVideo = {
    id: 'video-1',
  };

  const mockRecommendations = [
    {
      id: 'rec-1',
      title: 'Dinosaurs 101',
      thumbnailPath: 'thumb1.jpg',
      duration: 300,
      ageRating: 'AGE_7_PLUS' as const,
      categories: ['EDUCATIONAL'],
      topics: ['dinosaurs', 'science'],
      channel: {
        id: 'channel-1',
        name: 'Science Channel',
        thumbnailPath: 'channel1.jpg',
      },
      status: 'READY' as const,
      approvalStatus: 'APPROVED' as const,
      familyId: 'family-1',
      sourceUrl: 'https://example.com',
      sourceType: 'YOUTUBE' as const,
      localPath: null,
      hlsPath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      importedAt: new Date(),
      channelId: 'channel-1',
      collectionId: null,
      description: null,
    },
    {
      id: 'rec-2',
      title: 'Space Exploration',
      thumbnailPath: 'thumb2.jpg',
      duration: 450,
      ageRating: 'AGE_7_PLUS' as const,
      categories: ['EDUCATIONAL', 'SCIENCE'],
      topics: ['space', 'planets'],
      channel: {
        id: 'channel-2',
        name: 'Space Kids',
        thumbnailPath: 'channel2.jpg',
      },
      status: 'READY' as const,
      approvalStatus: 'APPROVED' as const,
      familyId: 'family-1',
      sourceUrl: 'https://example.com',
      sourceType: 'YOUTUBE' as const,
      localPath: null,
      hlsPath: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      importedAt: new Date(),
      channelId: 'channel-2',
      collectionId: null,
      description: null,
    },
  ];

  it('should return recommendations successfully', async () => {
    prismaMock.childProfile.findUnique.mockResolvedValue(mockChildProfile as any);
    prismaMock.video.findUnique.mockResolvedValue(mockVideo as any);
    (getRecommendedVideos as jest.Mock).mockResolvedValue(mockRecommendations);

    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=child-1&limit=10'
    );

    const response = await GET(request, { params: { videoId: 'video-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations).toHaveLength(2);
    expect(data.count).toBe(2);
    expect(data.recommendations[0]).toMatchObject({
      id: 'rec-1',
      title: 'Dinosaurs 101',
      thumbnailPath: 'thumb1.jpg',
      duration: 300,
    });
  });

  it('should return 400 if childProfileId is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1'
    );

    const response = await GET(request, { params: { videoId: 'video-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('childProfileId is required');
  });

  it('should return 400 if limit is invalid', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=child-1&limit=invalid'
    );

    const response = await GET(request, { params: { videoId: 'video-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('limit must be between 1 and 50');
  });

  it('should return 400 if limit is too high', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=child-1&limit=100'
    );

    const response = await GET(request, { params: { videoId: 'video-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('limit must be between 1 and 50');
  });

  it('should return 404 if child profile not found', async () => {
    prismaMock.childProfile.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=invalid'
    );

    const response = await GET(request, { params: { videoId: 'video-1' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Child profile not found');
  });

  it('should return 404 if video not found', async () => {
    prismaMock.childProfile.findUnique.mockResolvedValue(mockChildProfile as any);
    prismaMock.video.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/invalid?childProfileId=child-1'
    );

    const response = await GET(request, { params: { videoId: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Video not found');
  });

  it('should use default limit of 10 if not specified', async () => {
    prismaMock.childProfile.findUnique.mockResolvedValue(mockChildProfile as any);
    prismaMock.video.findUnique.mockResolvedValue(mockVideo as any);
    (getRecommendedVideos as jest.Mock).mockResolvedValue(mockRecommendations);

    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=child-1'
    );

    await GET(request, { params: { videoId: 'video-1' } });

    expect(getRecommendedVideos).toHaveBeenCalledWith({
      currentVideoId: 'video-1',
      childProfileId: 'child-1',
      familyId: 'family-1',
      limit: 10,
    });
  });

  it('should respect custom limit parameter', async () => {
    prismaMock.childProfile.findUnique.mockResolvedValue(mockChildProfile as any);
    prismaMock.video.findUnique.mockResolvedValue(mockVideo as any);
    (getRecommendedVideos as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=child-1&limit=5'
    );

    await GET(request, { params: { videoId: 'video-1' } });

    expect(getRecommendedVideos).toHaveBeenCalledWith({
      currentVideoId: 'video-1',
      childProfileId: 'child-1',
      familyId: 'family-1',
      limit: 5,
    });
  });

  it('should return empty array when no recommendations found', async () => {
    prismaMock.childProfile.findUnique.mockResolvedValue(mockChildProfile as any);
    prismaMock.video.findUnique.mockResolvedValue(mockVideo as any);
    (getRecommendedVideos as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=child-1'
    );

    const response = await GET(request, { params: { videoId: 'video-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations).toEqual([]);
    expect(data.count).toBe(0);
  });

  it('should return 500 on unexpected errors', async () => {
    prismaMock.childProfile.findUnique.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=child-1'
    );

    const response = await GET(request, { params: { videoId: 'video-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch recommendations');
  });

  it('should include channel information in response', async () => {
    prismaMock.childProfile.findUnique.mockResolvedValue(mockChildProfile as any);
    prismaMock.video.findUnique.mockResolvedValue(mockVideo as any);
    (getRecommendedVideos as jest.Mock).mockResolvedValue([mockRecommendations[0]]);

    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=child-1'
    );

    const response = await GET(request, { params: { videoId: 'video-1' } });
    const data = await response.json();

    expect(data.recommendations[0].channel).toEqual({
      id: 'channel-1',
      name: 'Science Channel',
      thumbnailPath: 'channel1.jpg',
    });
  });

  it('should handle null channel gracefully', async () => {
    const videoWithoutChannel = {
      ...mockRecommendations[0],
      channel: null,
    };

    prismaMock.childProfile.findUnique.mockResolvedValue(mockChildProfile as any);
    prismaMock.video.findUnique.mockResolvedValue(mockVideo as any);
    (getRecommendedVideos as jest.Mock).mockResolvedValue([videoWithoutChannel]);

    const request = new NextRequest(
      'http://localhost:3000/api/recommendations/video-1?childProfileId=child-1'
    );

    const response = await GET(request, { params: { videoId: 'video-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations[0].channel).toBeNull();
  });
});
