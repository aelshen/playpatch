/**
 * Favorites Section Component
 * Displays child's favorited videos
 */

import { prisma } from '@/lib/db/client';
import { ChildVideoGrid } from './video-grid';
import { Heart } from 'lucide-react';

interface FavoritesSectionProps {
  childId: string;
  mode: 'toddler' | 'explorer';
}

export async function FavoritesSection({ childId, mode }: FavoritesSectionProps) {
  // Fetch favorited videos for this child
  const favorites = await prisma.favorite.findMany({
    where: {
      childId,
    },
    include: {
      video: {
        include: {
          channel: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: mode === 'toddler' ? 6 : 8,
  });

  // Extract videos from favorites
  const videos = favorites
    .filter(fav => fav.video.status === 'READY' && fav.video.approvalStatus === 'APPROVED')
    .map(fav => fav.video);

  if (videos.length === 0) {
    return null; // Don't show section if no favorites
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Heart className={`${mode === 'toddler' ? 'w-8 h-8' : 'w-6 h-6'} text-pink-500 fill-pink-500`} />
        <h2 className={`${mode === 'toddler' ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>
          My Favorites
        </h2>
      </div>
      <ChildVideoGrid videos={videos} />
    </div>
  );
}
