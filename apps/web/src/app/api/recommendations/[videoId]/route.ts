/**
 * Recommendations API Endpoint
 * GET /api/recommendations/[videoId]?limit=10
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedVideos } from '@/lib/recommendations/engine';
import { prisma } from '@/lib/db/client';
import { getCurrentChildProfile } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params;
  const searchParams = request.nextUrl.searchParams;
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 10;

  try {
    const childProfile = await getCurrentChildProfile();

    if (!childProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Fetch familyId via the child's user relation
    const childProfileWithFamily = await prisma.childProfile.findUnique({
      where: { id: childProfile.id },
      select: {
        id: true,
        user: {
          select: {
            familyId: true,
          },
        },
      },
    });

    if (!childProfileWithFamily) {
      return NextResponse.json(
        { error: 'Child profile not found' },
        { status: 404 }
      );
    }

    const familyId = childProfileWithFamily.user.familyId;

    // Verify the video exists and belongs to this family
    const video = await prisma.video.findFirst({
      where: { id: videoId, familyId },
      select: { id: true },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Get recommendations
    const recommendations = await getRecommendedVideos({
      currentVideoId: videoId,
      childProfileId: childProfile.id,
      familyId,
      limit,
    });

    return NextResponse.json({
      recommendations: recommendations.map((video) => ({
        id: video.id,
        title: video.title,
        thumbnailPath: video.thumbnailPath,
        duration: video.duration,
        ageRating: video.ageRating,
        categories: video.categories,
        topics: video.topics,
        channel: video.channel
          ? {
              id: video.channel.id,
              name: video.channel.name,
              thumbnailPath: video.channel.thumbnailUrl,
            }
          : null,
      })),
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      videoId,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
