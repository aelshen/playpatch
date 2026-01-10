/**
 * Queue Monitor Component
 * Shows real-time status of all queues
 */

'use client';

import { useState, useEffect } from 'react';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
  jobs: {
    waiting: Array<{
      id: string;
      videoId: string;
      videoUrl: string;
      addedAt: number;
    }>;
    active: Array<{
      id: string;
      videoId: string;
      videoUrl: string;
      progress: number;
      startedAt: number;
    }>;
    failed: Array<{
      id: string;
      videoId: string;
      videoUrl: string;
      failedReason: string;
      attempts: number;
    }>;
  };
}

export function QueueMonitor() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/queue/status');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch queue stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const extractVideoTitle = (url: string) => {
    try {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
      return videoId;
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <div className="text-4xl mb-2">⏳</div>
        <p className="text-gray-600">Loading queue status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-yellow-50 p-6 shadow">
          <div className="text-sm text-gray-600">Waiting</div>
          <div className="text-3xl font-bold text-yellow-600">{stats?.waiting || 0}</div>
          <div className="text-xs text-gray-500 mt-1">In queue</div>
        </div>

        <div className="rounded-lg bg-blue-50 p-6 shadow">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-3xl font-bold text-blue-600">{stats?.active || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Processing now</div>
        </div>

        <div className="rounded-lg bg-green-50 p-6 shadow">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-3xl font-bold text-green-600">{stats?.completed || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Successful</div>
        </div>

        <div className="rounded-lg bg-red-50 p-6 shadow">
          <div className="text-sm text-gray-600">Failed</div>
          <div className="text-3xl font-bold text-red-600">{stats?.failed || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Errors</div>
        </div>
      </div>

      {/* Waiting Jobs */}
      {stats?.jobs.waiting && stats.jobs.waiting.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Waiting Jobs ({stats.jobs.waiting.length})
          </h2>
          <div className="space-y-3">
            {stats.jobs.waiting.map((job, index) => (
              <div
                key={job.id}
                className="flex items-center justify-between border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl font-bold text-yellow-600">#{index + 1}</div>
                  <div>
                    <a
                      href={`/admin/content/${job.videoId}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      Video: {extractVideoTitle(job.videoUrl)}
                    </a>
                    <p className="text-xs text-gray-600 mt-1">
                      Job ID: {job.id} • Queued{' '}
                      {new Date(job.addedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">⏳ Waiting</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Jobs */}
      {stats?.jobs.active && stats.jobs.active.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Jobs ({stats.jobs.active.length})
          </h2>
          <div className="space-y-3">
            {stats.jobs.active.map((job) => (
              <div
                key={job.id}
                className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded"
              >
                <div className="flex items-center justify-between mb-2">
                  <a
                    href={`/admin/content/${job.videoId}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    Video: {extractVideoTitle(job.videoUrl)}
                  </a>
                  <div className="text-sm font-medium text-blue-600">
                    {Math.round(job.progress)}%
                  </div>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Job ID: {job.id} • Started{' '}
                  {new Date(job.startedAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Jobs */}
      {stats?.jobs.failed && stats.jobs.failed.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Failed Jobs ({stats.jobs.failed.length})
          </h2>
          <div className="space-y-3">
            {stats.jobs.failed.map((job) => (
              <div
                key={job.id}
                className="border-l-4 border-red-400 bg-red-50 p-4 rounded"
              >
                <div className="flex items-center justify-between mb-2">
                  <a
                    href={`/admin/content/${job.videoId}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    Video: {extractVideoTitle(job.videoUrl)}
                  </a>
                  <div className="text-xs text-red-600 font-medium">
                    Attempt {job.attempts}/3
                  </div>
                </div>
                <div className="bg-red-100 p-2 rounded text-xs text-red-700 mb-2">
                  <strong>Error:</strong> {job.failedReason}
                </div>
                <p className="text-xs text-gray-600">Job ID: {job.id}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Queue Information</h2>

        <div className="space-y-4">
          {stats?.waiting > 0 && (
            <div className="flex items-center space-x-3">
              <div className="text-2xl">⏳</div>
              <div>
                <p className="font-medium text-gray-900">
                  {stats.waiting} job{stats.waiting !== 1 ? 's' : ''} waiting to be processed
                </p>
                <p className="text-sm text-gray-600">
                  Jobs are processed by background workers in order
                </p>
              </div>
            </div>
          )}

          {stats?.active > 0 && (
            <div className="flex items-center space-x-3">
              <div className="text-2xl">▶️</div>
              <div>
                <p className="font-medium text-gray-900">
                  {stats.active} job{stats.active !== 1 ? 's' : ''} currently processing
                </p>
                <p className="text-sm text-gray-600">
                  Workers can process up to 2 downloads concurrently
                </p>
              </div>
            </div>
          )}

          {stats?.failed > 0 && (
            <div className="flex items-center space-x-3">
              <div className="text-2xl">❌</div>
              <div>
                <p className="font-medium text-red-900">
                  {stats.failed} failed job{stats.failed !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-700">
                  Jobs are automatically retried up to 3 times before failing permanently
                </p>
              </div>
            </div>
          )}

          {stats?.waiting === 0 && stats?.active === 0 && (
            <div className="flex items-center space-x-3">
              <div className="text-2xl">✅</div>
              <div>
                <p className="font-medium text-green-900">All caught up!</p>
                <p className="text-sm text-gray-600">
                  No jobs currently queued or processing
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Auto-refreshes every 5 seconds • Total jobs: {stats?.total || 0}
          </p>
        </div>
      </div>

      {/* Worker Status */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Worker Status</h3>
        <p className="text-sm text-blue-800">
          Check your terminal where <code className="px-1 bg-blue-100 rounded">pnpm dev:workers</code> is running to see worker logs and activity.
        </p>
      </div>
    </div>
  );
}
