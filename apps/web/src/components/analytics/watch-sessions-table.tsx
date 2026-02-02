/**
 * Watch Sessions Table Component
 * SSK-156: Watch Time Analytics Dashboard
 *
 * Displays recent watch sessions in a table
 */

'use client';

import { format } from 'date-fns';
import Link from 'next/link';

interface WatchSession {
  id: string;
  childId: string;
  videoId: string;
  startedAt: string;
  endedAt: string | null;
  duration: number; // seconds
  lastPosition: number; // seconds
  completed: boolean;
  video: {
    id: string;
    title: string;
    thumbnailPath: string | null;
  };
}

interface ChildProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface WatchSessionsTableProps {
  sessions: WatchSession[];
  profiles: ChildProfile[];
}

export function WatchSessionsTable({ sessions, profiles }: WatchSessionsTableProps) {
  // Format duration (seconds) to readable format
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Get child name by ID
  const getChildName = (childId: string): string => {
    const profile = profiles.find((p) => p.id === childId);
    return profile?.name || 'Unknown';
  };

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Watch Sessions</h2>
        <p className="mt-1 text-sm text-gray-600">
          Latest viewing activity across all profiles
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Video
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Child
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Started
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {session.video.thumbnailPath && (
                      <img
                        src={
                          session.video.thumbnailPath.startsWith('http')
                            ? session.video.thumbnailPath
                            : `/api/thumbnails/${session.video.thumbnailPath}`
                        }
                        alt={session.video.title}
                        className="h-10 w-16 rounded object-cover"
                      />
                    )}
                    <div className="ml-3">
                      <Link
                        href={`/admin/content/${session.video.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {session.video.title}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{getChildName(session.childId)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {format(new Date(session.startedAt), 'MMM d, h:mm a')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {formatDuration(session.duration)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {session.completed ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                      In Progress
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessions.length > 10 && (
        <div className="border-t border-gray-200 px-6 py-4 text-center">
          <p className="text-sm text-gray-600">
            Showing {Math.min(sessions.length, 10)} of {sessions.length} sessions
          </p>
        </div>
      )}
    </div>
  );
}
