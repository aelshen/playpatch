/**
 * Favorites API Endpoint
 * POST /api/favorites - Add a favorite
 * DELETE /api/favorites - Remove a favorite
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

/**
 * Add a video to child's favorites
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childProfileId, videoId } = body;

    // Validate parameters
    if (!childProfileId || !videoId) {
      return NextResponse.json(
        { error: 'childProfileId and videoId are required' },
        { status: 400 }
      );
    }

    // Verify child profile exists
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childProfileId },
      select: { id: true },
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

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        childId_videoId: {
          childId: childProfileId,
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

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        childId: childProfileId,
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
    const body = await request.json();
    const { childProfileId, videoId } = body;

    // Validate parameters
    if (!childProfileId || !videoId) {
      return NextResponse.json(
        { error: 'childProfileId and videoId are required' },
        { status: 400 }
      );
    }

    // Try to delete the favorite
    try {
      await prisma.favorite.delete({
        where: {
          childId_videoId: {
            childId: childProfileId,
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
