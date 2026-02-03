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
  // Fetch incomplete watch sessions with 10-90% completion
  const incompleteSessions = await prisma.watchSession.findMany({
    where: {
      childId,
      completed: false,
      lastPosition: {
        gt: 0, // Has started watching
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
    take: 50, // Fetch more to filter by percentage
    distinct: ['videoId'], // One session per video
  });

  // Filter by 10-90% completion and map to video format
  const videos = incompleteSessions
    .filter(session => {
      // Only show ready and approved videos
      if (session.video.status !== 'READY' || session.video.approvalStatus !== 'APPROVED') {
        return false;
      }

      // Calculate percentage watched
      const duration = session.video.duration;
      if (duration === 0) return false;

      const percentageWatched = session.lastPosition / duration;

      // Only show videos with 10-90% completion
      return percentageWatched >= 0.1 && percentageWatched <= 0.9;
    })
    .slice(0, mode === 'toddler' ? 4 : 6) // Limit after filtering
    .map(session => ({
      ...session.video,
      watchProgress: {
        position: session.lastPosition,
        completed: session.completed,
      },
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
