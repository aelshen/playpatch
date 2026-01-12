/**
 * Continue Watching Section
 * Shows videos the child started but didn't finish
 */

import { prisma } from '@/lib/db/client';
import { ChildVideoGrid } from './video-grid';
import { Play } from 'lucide-react';

interface ContinueWatchingProps {
  childId: string;
  mode: 'toddler' | 'explorer';
}

export async function ContinueWatching({ childId, mode }: ContinueWatchingProps) {
  // Fetch incomplete watch sessions (not completed, have progress)
  const incompleteSessions = await prisma.watchSession.findMany({
    where: {
      childId,
      completed: false,
      lastPosition: {
        gt: 30, // At least 30 seconds watched
      },
    },
    include: {
      video: {
        include: {
          channel: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: mode === 'toddler' ? 4 : 6,
    distinct: ['videoId'], // One session per video
  });

  // Extract unique videos
  const videos = incompleteSessions
    .filter(session => session.video.status === 'READY' && session.video.approvalStatus === 'APPROVED')
    .map(session => ({
      ...session.video,
      watchProgress: session.lastPosition, // Add watch progress
    }));

  if (videos.length === 0) {
    return null; // Don't show section if nothing to continue
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Play className={`${mode === 'toddler' ? 'w-8 h-8' : 'w-6 h-6'} text-blue-500 fill-blue-500`} />
        <h2 className={`${mode === 'toddler' ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>
          Continue Watching
        </h2>
      </div>
      <ChildVideoGrid videos={videos} />
    </div>
  );
}
