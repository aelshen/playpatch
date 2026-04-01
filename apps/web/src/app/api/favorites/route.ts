/**
 * Favorites API Endpoint
 * POST /api/favorites - Add a favorite
 * DELETE /api/favorites - Remove a favorite
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentChildProfile } from '@/lib/auth/session';

/**
 * Add a video to child's favorites
 */
export async function POST(request: NextRequest) {
  try {
    const childProfile = await getCurrentChildProfile();

    if (!childProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoId } = body;

    // Validate parameters
    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
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

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        childId_videoId: {
          childId: childProfile.id,
          videoId: videoId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Video already favorited', favorite: existing },
        { status: 200 }
      );
    }

    // Create favorite using the authenticated child's id
    const favorite = await prisma.favorite.create({
      data: {
        childId: childProfile.id,
        videoId: videoId,
      },
    });

    return NextResponse.json(
      { message: 'Video added to favorites', favorite },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      {
        error: 'Failed to add favorite',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Remove a video from child's favorites
 */
export async function DELETE(request: NextRequest) {
  try {
    const childProfile = await getCurrentChildProfile();

    if (!childProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoId } = body;

    // Validate parameters
    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    // Try to delete the favorite using the authenticated child's id
    try {
      await prisma.favorite.delete({
        where: {
          childId_videoId: {
            childId: childProfile.id,
            videoId: videoId,
          },
        },
      });

      return NextResponse.json(
        { message: 'Video removed from favorites' },
        { status: 200 }
      );
    } catch (deleteError: any) {
      // If favorite doesn't exist, return 404
      if (deleteError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Favorite not found' },
          { status: 404 }
        );
      }
      throw deleteError;
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove favorite',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
