/**
 * Shows Section — groups Plex channels as TV show cards
 */

import Link from 'next/link';
import { prisma } from '@/lib/db/client';
import { getAllowedAgeRatings } from '@/lib/utils/age-rating';
import { AgeRating } from '@prisma/client';

interface ShowsSectionProps {
  ageRating: AgeRating;
  familyId: string;
}

export async function ShowsSection({ ageRating, familyId }: ShowsSectionProps) {
  const allowedRatings = getAllowedAgeRatings(ageRating);

  // Find Plex channels that have approved, watchable episodes
  const channels = await prisma.channel.findMany({
    where: {
      familyId,
      sourceType: 'PLEX',
      videos: {
        some: {
          approvalStatus: 'APPROVED',
          playbackMode: { in: ['EMBED', 'HLS'] },
          ageRating: { in: allowedRatings },
        },
      },
    },
    include: {
      videos: {
        where: {
          approvalStatus: 'APPROVED',
          playbackMode: { in: ['EMBED', 'HLS'] },
          ageRating: { in: allowedRatings },
        },
        orderBy: { sourceId: 'asc' },
        select: {
          id: true,
          thumbnailPath: true,
          duration: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  if (channels.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-3xl">📺</span>
        <h2 className="text-2xl font-bold text-gray-900">Shows</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {channels.map((channel) => {
          const episodeCount = channel.videos.length;
          const thumbnail = channel.videos.find((v) => v.thumbnailPath)?.thumbnailPath;
          const totalMinutes = Math.round(
            channel.videos.reduce((s, v) => s + v.duration, 0) / 60
          );

          return (
            <Link
              key={channel.id}
              href={`/child/show/${channel.id}`}
              className="group"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-800 shadow-md transition-all group-hover:shadow-xl group-hover:scale-[1.02]">
                {thumbnail ? (
                  <img
                    src={thumbnail.startsWith('http') ? thumbnail : `/api/thumbnails/${thumbnail}`}
                    alt={channel.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                    <span className="text-5xl">📺</span>
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {/* Episode count badge */}
                <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                  {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
                </div>
              </div>
              <div className="mt-2">
                <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600">
                  {channel.name}
                </h3>
                {totalMinutes > 0 && (
                  <p className="text-sm text-gray-500">
                    {totalMinutes < 60
                      ? `${totalMinutes} min`
                      : `${Math.round(totalMinutes / 60)} hr`}{' '}
                    total
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
