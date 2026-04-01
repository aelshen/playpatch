/**
 * Playlists API Endpoint
 * GET /api/playlists - Get child's playlists
 * POST /api/playlists - Create a new playlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { getCurrentChildProfile } from '@/lib/auth/session';

/**
 * Get all playlists for the authenticated child
 */
export async function GET(request: NextRequest) {
  try {
    const childProfile = await getCurrentChildProfile();

    if (!childProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get playlists with video counts
    const playlists = await prisma.childPlaylist.findMany({
      where: { childId: childProfile.id },
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
 * Create a new playlist for the authenticated child
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
    const { name, description } = body;

    // Validate parameters
    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    // Create playlist using the authenticated child's id
    const playlist = await prisma.childPlaylist.create({
      data: {
        childId: childProfile.id,
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
