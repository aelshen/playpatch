/**
 * Requests API Endpoint
 * POST /api/requests - Create a new request from child
 * GET /api/requests?childProfileId=X - Get requests for a child (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

/**
 * Get requests for a child (optional, mainly for admin dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const childProfileId = searchParams.get('childProfileId');
    const status = searchParams.get('status');

    const where: any = {};

    if (childProfileId) {
      where.childId = childProfileId;
    }

    if (status) {
      where.status = status;
    }

    const requests = await prisma.requestFromChild.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        video: {
          select: {
            id: true,
            title: true,
            thumbnailPath: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch requests',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Create a new request from child
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childProfileId, videoId, requestType, message } = body;

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
      select: { id: true, name: true },
    });

    if (!childProfile) {
      return NextResponse.json(
        { error: 'Child profile not found' },
        { status: 404 }
      );
    }

    // If videoId provided, verify it exists
    if (videoId) {
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
    }

    // Validate request type
    const validRequestTypes = ['MORE_LIKE_THIS', 'SPECIFIC_TOPIC', 'NEW_CHANNEL', 'OTHER'];
    if (requestType && !validRequestTypes.includes(requestType)) {
      return NextResponse.json(
        { error: `Invalid requestType. Must be one of: ${validRequestTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create request
    const childRequest = await prisma.requestFromChild.create({
      data: {
        childId: childProfileId,
        videoId: videoId || null,
        requestType: requestType || 'MORE_LIKE_THIS',
        message: message || null,
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        video: {
          select: {
            id: true,
            title: true,
            thumbnailPath: true,
          },
        },
      },
    });

    // TODO: Send notification to admin dashboard
    // This could be implemented with WebSocket, webhook, or email notification

    return NextResponse.json(
      {
        message: 'Request submitted successfully',
        request: childRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      {
        error: 'Failed to create request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
