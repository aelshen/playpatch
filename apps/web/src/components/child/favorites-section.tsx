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

  // Extract watchable videos from favorites
  const videos = favorites
    .filter(
      (fav) =>
        ['EMBED', 'HLS'].includes(fav.video.playbackMode) && fav.video.approvalStatus === 'APPROVED'
    )
    .map((fav) => fav.video);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Heart
          className={`${mode === 'toddler' ? 'h-8 w-8' : 'h-6 w-6'} fill-pink-500 text-pink-500`}
        />
        <h2 className={`${mode === 'toddler' ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>
          My Favorites
        </h2>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-xl bg-pink-50 p-8 text-center">
          <div className={`mb-3 ${mode === 'toddler' ? 'text-5xl' : 'text-4xl'}`}>🤍</div>
          <p
            className={`font-medium text-pink-700 ${mode === 'toddler' ? 'text-xl' : 'text-base'}`}
          >
            No favorites yet!
          </p>
          <p className={`mt-1 text-pink-500 ${mode === 'toddler' ? 'text-base' : 'text-sm'}`}>
            Tap the heart on videos you love to save them here.
          </p>
        </div>
      ) : (
        <ChildVideoGrid videos={videos} />
      )}
    </div>
  );
}
