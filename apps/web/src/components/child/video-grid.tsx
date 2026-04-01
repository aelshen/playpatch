/**
 * Child Video Grid Component
 * SSK-075: Video Player Component
 *
 * Video grid for child-facing pages with links to watch page
 */

import Link from 'next/link';
import { VideoProgressBar } from '@/components/ui/progress-bar';

interface Video {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  thumbnailPath: string | null;
  channel?: {
    id: string;
    name: string;
  } | null;
  watchProgress?: {
    position: number;
    completed: boolean;
  } | null;
}

interface VideoGridProps {
  videos: Video[];
  emptyMessage?: string;
  emptyIcon?: string;
}

export function ChildVideoGrid({
  videos,
  emptyMessage = 'No videos here yet!',
  emptyIcon = '🎬',
}: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-xl bg-white/60 p-10 text-center">
        <div className="mb-3 text-5xl">{emptyIcon}</div>
        <p className="text-lg font-medium text-gray-700">{emptyMessage}</p>
        <p className="mt-1 text-sm text-gray-500">Check back soon for new videos!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {videos.map((video) => (
        <Link key={video.id} href={`/child/watch/${video.id}`} className="group">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800 shadow-md transition-shadow hover:shadow-xl">
            {/* Thumbnail */}
            {video.thumbnailPath && (
              <img
                src={
                  video.thumbnailPath.startsWith('http')
                    ? video.thumbnailPath
                    : `/api/thumbnails/${video.thumbnailPath}`
                }
                alt={video.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
              />
            )}

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
              <svg
                className="h-12 w-12 text-white opacity-0 transition-opacity group-hover:opacity-100"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>

            {/* Duration badge */}
            {video.duration > 0 && (
              <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
                {Math.floor(video.duration / 60)}:
                {(video.duration % 60).toString().padStart(2, '0')}
              </div>
            )}

            {/* Completed badge */}
            {video.watchProgress?.completed && (
              <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Watch progress bar */}
          {video.watchProgress &&
            video.watchProgress.position > 0 &&
            !video.watchProgress.completed && (
              <div className="absolute bottom-0 left-0 right-0">
                <VideoProgressBar
                  position={video.watchProgress.position}
                  duration={video.duration}
                />
              </div>
            )}

          {/* Video info */}
          <div className="mt-2">
            <h3 className="line-clamp-2 font-medium text-gray-900">{video.title}</h3>
            {video.channel && <p className="text-sm text-gray-600">{video.channel.name}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
