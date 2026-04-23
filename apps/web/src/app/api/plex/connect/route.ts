/**
 * Plex Connection API
 * GET  /api/plex/connect  — get current connection status
 * POST /api/plex/connect  — save and verify a Plex connection
 * DELETE /api/plex/connect — remove Plex connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { testPlexConnection } from '@/lib/media/plex';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conn = await prisma.plexConnection.findUnique({
      where: { familyId: user.familyId },
      select: { id: true, serverUrl: true, serverName: true, isVerified: true, updatedAt: true },
    });

    return NextResponse.json({ connection: conn });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch Plex connection');
    return NextResponse.json({ error: 'Failed to fetch connection' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { serverUrl, token } = await request.json();

    if (!serverUrl || !token) {
      return NextResponse.json({ error: 'serverUrl and token are required' }, { status: 400 });
    }

    // Validate serverUrl format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(serverUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid server URL' }, { status: 400 });
    }

    // Only allow http/https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Server URL must use http or https' }, { status: 400 });
    }

    // Test the connection
    let serverName: string;
    try {
      serverName = await testPlexConnection(serverUrl, token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not connect to Plex server';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Save connection
    const conn = await prisma.plexConnection.upsert({
      where: { familyId: user.familyId },
      create: { familyId: user.familyId, serverUrl: parsedUrl.origin, token, serverName, isVerified: true },
      update: { serverUrl: parsedUrl.origin, token, serverName, isVerified: true },
    });

    logger.info({ familyId: user.familyId, serverName }, 'Plex connection saved');

    return NextResponse.json({
      connection: { id: conn.id, serverUrl: conn.serverUrl, serverName: conn.serverName, isVerified: conn.isVerified },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to save Plex connection');
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.plexConnection.deleteMany({ where: { familyId: user.familyId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'Failed to delete Plex connection');
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
