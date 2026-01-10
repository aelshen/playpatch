/**
 * Most Watched Videos Component
 * SSK-156: Watch Time Analytics Dashboard
 *
 * Displays most watched videos with stats
 */

'use client';

import Link from 'next/link';

interface MostWatchedVideo {
  video: {
    id: string;
    title: string;
    thumbnailPath: string | null;
  } | null;
  watchCount: number;
  totalWatchTime: number; // seconds
}

interface MostWatchedVideosProps {
  videos: MostWatchedVideo[];
}

export function MostWatchedVideos({ videos }: MostWatchedVideosProps) {
  // Format watch time (seconds) to readable format
  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Most Watched Videos</h2>
        <p className="mt-1 text-sm text-gray-600">
          Videos watched most frequently by your children
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {videos.map((item, index) => {
          if (!item.video) return null;

          return (
            <div key={item.video.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                  </div>

                  {/* Thumbnail */}
                  {item.video.thumbnailPath && (
                    <img
                      src={
                        item.video.thumbnailPath.startsWith('http')
                          ? item.video.thumbnailPath
                          : `/api/thumbnails/${item.video.thumbnailPath}`
                      }
                      alt={item.video.title}
                      className="h-16 w-24 rounded object-cover"
                    />
                  )}

                  {/* Video Info */}
                  <div>
                    <Link
                      href={`/admin/content/${item.video.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {item.video.title}
                    </Link>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <svg
                          className="mr-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {item.watchCount} {item.watchCount === 1 ? 'view' : 'views'}
                      </span>
                      <span className="flex items-center">
                        <svg
                          className="mr-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatWatchTime(item.totalWatchTime)} total
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="ml-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatWatchTime(item.totalWatchTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {videos.length === 0 && (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-gray-600">No watch data available</p>
        </div>
      )}
    </div>
  );
}
