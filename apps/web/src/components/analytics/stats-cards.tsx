/**
 * Stats Cards Component
 * SSK-156: Watch Time Analytics Dashboard
 *
 * Displays key metrics in card format
 */

'use client';

interface StatsCardsProps {
  stats: {
    totalWatchTime: number; // in seconds
    totalSessions: number;
    completedVideos: number;
    averageSessionDuration: number; // in seconds
    uniqueVideosWatched: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  // Format watch time (seconds) to readable format
  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate completion rate
  const completionRate = stats.totalSessions > 0
    ? Math.round((stats.completedVideos / stats.totalSessions) * 100)
    : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Watch Time */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
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
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Watch Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatWatchTime(stats.totalWatchTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Videos Watched */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
            <svg
              className="h-6 w-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Videos Watched</p>
            <p className="text-2xl font-bold text-gray-900">{stats.uniqueVideosWatched}</p>
          </div>
        </div>
      </div>

      {/* Watch Sessions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
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
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Watch Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            <p className="text-xs text-gray-500">
              Avg: {formatWatchTime(stats.averageSessionDuration)}
            </p>
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-xs text-gray-500">
              {stats.completedVideos} completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
