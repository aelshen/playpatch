/**
 * Child Video Grid Component
 * SSK-075: Video Player Component
 *
 * Video grid for child-facing pages with links to watch page
 */

import Link from 'next/link';

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
}

interface VideoGridProps {
  videos: Video[];
}

export function ChildVideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-lg bg-white/50 p-8 text-center">
        <p className="text-gray-600">No videos available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/child/watch/${video.id}`}
          className="group"
        >
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
          </div>

          {/* Video info */}
          <div className="mt-2">
            <h3 className="font-medium text-gray-900 line-clamp-2">
              {video.title}
            </h3>
            {video.channel && (
              <p className="text-sm text-gray-600">{video.channel.name}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
