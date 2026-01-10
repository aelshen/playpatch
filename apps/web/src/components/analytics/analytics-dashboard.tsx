/**
 * Analytics Dashboard Component
 * SSK-156: Watch Time Analytics Dashboard
 *
 * Client component for interactive analytics display
 */

'use client';

import { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { StatsCards } from './stats-cards';
import { WatchSessionsTable } from './watch-sessions-table';
import { MostWatchedVideos } from './most-watched-videos';

interface ChildProfile {
  id: string;
  name: string;
  avatarPath: string | null;
  ageRating: string;
}

interface AnalyticsDashboardProps {
  profiles: ChildProfile[];
  familyId: string;
}

export function AnalyticsDashboard({ profiles }: AnalyticsDashboardProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [mostWatched, setMostWatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          profileId: selectedProfileId,
          dateRange,
        });

        const [statsRes, sessionsRes, mostWatchedRes] = await Promise.all([
          fetch(`/api/analytics/stats?${params}`),
          fetch(`/api/analytics/sessions?${params}`),
          fetch(`/api/analytics/most-watched?${params}`),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          setSessions(sessionsData.sessions || []);
        }

        if (mostWatchedRes.ok) {
          const mostWatchedData = await mostWatchedRes.json();
          setMostWatched(mostWatchedData.videos || []);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedProfileId, dateRange]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Child Profile Selector */}
          <div>
            <label htmlFor="profile" className="block text-sm font-medium text-gray-700">
              Child Profile
            </label>
            <select
              id="profile"
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Children</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">
              Time Period
            </label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | 'all')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && stats && <StatsCards stats={stats} />}

      {/* Most Watched Videos */}
      {!loading && mostWatched.length > 0 && (
        <MostWatchedVideos videos={mostWatched} />
      )}

      {/* Recent Watch Sessions */}
      {!loading && sessions.length > 0 && (
        <WatchSessionsTable sessions={sessions} profiles={profiles} />
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No watch data yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Watch sessions will appear here once your children start watching videos.
          </p>
        </div>
      )}
    </div>
  );
}
