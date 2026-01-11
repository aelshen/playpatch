/**
 * Playlists API Endpoint
 * GET /api/playlists?childProfileId=X - Get child's playlists
 * POST /api/playlists - Create a new playlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

/**
 * Get all playlists for a child
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const childProfileId = searchParams.get('childProfileId');

    // Validate parameters
    if (!childProfileId) {
      return NextResponse.json(
        { error: 'childProfileId is required' },
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

    // Get playlists with video counts
    const playlists = await prisma.childPlaylist.findMany({
      where: { childId: childProfileId },
      include: {
        videos: {
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailPath: true,
                duration: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      playlists: playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        videoCount: playlist.videos.length,
        videos: playlist.videos.map((pv) => pv.video),
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      })),
      count: playlists.length,
    });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch playlists',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Create a new playlist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childProfileId, name, description } = body;

    // Validate parameters
    if (!childProfileId || !name) {
      return NextResponse.json(
        { error: 'childProfileId and name are required' },
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

    // Create playlist
    const playlist = await prisma.childPlaylist.create({
      data: {
        childId: childProfileId,
        name: name,
        description: description || null,
      },
    });

    return NextResponse.json(
      {
        message: 'Playlist created successfully',
        playlist: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          videoCount: 0,
          createdAt: playlist.createdAt,
          updatedAt: playlist.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      {
        error: 'Failed to create playlist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
