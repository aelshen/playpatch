/**
 * Recommendations API Endpoint
 * GET /api/recommendations/[videoId]?childProfileId=X&limit=10
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedVideos } from '@/lib/recommendations/engine';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { videoId } = params;
  const searchParams = request.nextUrl.searchParams;
  const childProfileId = searchParams.get('childProfileId');
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 10;

  try {

    // Validate parameters
    if (!childProfileId) {
      return NextResponse.json(
        { error: 'childProfileId is required' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Verify child profile exists and get familyId through user
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childProfileId },
      select: {
        id: true,
        user: {
          select: {
            familyId: true
          }
        }
      },
    });

    if (!childProfile) {
      return NextResponse.json(
        { error: 'Child profile not found' },
        { status: 404 }
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
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
      childProfileId,
      familyId: childProfile.user.familyId,
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
      childProfileId,
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
