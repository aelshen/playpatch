/**
 * Stats Cards Component
 * SSK-156: Watch Time Analytics Dashboard
 *
 * Displays key metrics in card format
 */

'use client';

import { Clock, Video, Play, CheckCircle } from 'lucide-react';
import { KPICardEnhanced } from './kpi-card-enhanced';

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
      <KPICardEnhanced
        title="Total Watch Time"
        value={formatWatchTime(stats.totalWatchTime)}
        icon={Clock}
        iconColor="text-blue-500"
        format="custom"
      />

      {/* Videos Watched */}
      <KPICardEnhanced
        title="Videos Watched"
        value={stats.uniqueVideosWatched}
        icon={Video}
        iconColor="text-purple-500"
        format="number"
      />

      {/* Watch Sessions */}
      <KPICardEnhanced
        title="Watch Sessions"
        value={stats.totalSessions}
        icon={Play}
        iconColor="text-green-500"
        subtitle={`Avg: ${formatWatchTime(stats.averageSessionDuration)}`}
        format="number"
      />

      {/* Completion Rate */}
      <KPICardEnhanced
        title="Completion Rate"
        value={completionRate}
        icon={CheckCircle}
        iconColor="text-yellow-500"
        subtitle={`${stats.completedVideos} completed`}
        format="percentage"
      />
    </div>
  );
}
