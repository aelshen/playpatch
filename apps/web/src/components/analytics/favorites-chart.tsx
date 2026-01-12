'use client';

/**
 * Favorites Chart Component
 * Displays favorites trend over time and top favorited content
 */

import { useState, useEffect } from 'react';
import { Heart, TrendingUp, Video } from 'lucide-react';
import { LineChart, BarChart } from '@/components/charts';

interface FavoriteStats {
  totalFavorites: number;
  favoriteTrend: Array<{ date: string; count: number }>;
  topFavorited: Array<{
    videoId: string;
    videoTitle: string;
    favoriteCount: number;
  }>;
  categoryDistribution: Record<string, number>;
}

interface FavoritesChartProps {
  profileId: string;
  startDate: Date;
  endDate: Date;
}

export function FavoritesChart({
  profileId,
  startDate,
  endDate,
}: FavoritesChartProps) {
  const [stats, setStats] = useState<FavoriteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          profileId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const res = await fetch(`/api/analytics/interactions/favorites?${params}`);

        if (!res.ok) {
          throw new Error('Failed to fetch favorites stats');
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [profileId, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Error loading favorites: {error}</p>
      </div>
    );
  }

  if (!stats || stats.totalFavorites === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-pink-500" />
          <h3 className="text-lg font-semibold text-gray-900">Favorites</h3>
        </div>
        <div className="text-center py-8">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No favorites yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Favorited videos will appear here
          </p>
        </div>
      </div>
    );
  }

  // Prepare trend data for line chart
  const trendData = stats.favoriteTrend.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    favorites: item.count,
  }));

  // Prepare top favorited for bar chart
  const topFavoritedData = stats.topFavorited.slice(0, 10).map((item) => ({
    video: item.videoTitle.length > 30
      ? item.videoTitle.substring(0, 30) + '...'
      : item.videoTitle,
    count: item.favoriteCount,
  }));

  // Prepare category distribution for bar chart
  const categoryData = Object.entries(stats.categoryDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, count]) => ({
      category,
      count,
    }));

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Favorites Analytics
            </h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {stats.totalFavorites}
            </div>
            <div className="text-sm text-gray-500">Total Favorites</div>
          </div>
        </div>

        {/* Favorites Trend Line Chart */}
        {trendData.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Favorites Over Time
            </h4>
            <LineChart
              data={trendData}
              xKey="date"
              yKeys={['favorites']}
              colors={['#EC4899']}
              height={200}
              showArea={true}
              showGrid={true}
              showLegend={false}
            />
          </div>
        )}
      </div>

      {/* Top Favorited Videos and Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Favorited Videos */}
        {topFavoritedData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-pink-500" />
              <h4 className="text-sm font-semibold text-gray-900">
                Most Favorited Videos
              </h4>
            </div>
            <BarChart
              data={topFavoritedData}
              xKey="video"
              yKeys={['count']}
              horizontal={true}
              showValues={true}
              showLegend={false}
              height={Math.max(250, topFavoritedData.length * 35)}
              colors={['#EC4899']}
            />
          </div>
        )}

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              <h4 className="text-sm font-semibold text-gray-900">
                Favorite Categories
              </h4>
            </div>
            <BarChart
              data={categoryData}
              xKey="category"
              yKeys={['count']}
              horizontal={true}
              showValues={true}
              showLegend={false}
              height={Math.max(250, categoryData.length * 35)}
              colors={['#EC4899']}
            />
          </div>
        )}
      </div>

      {/* Top Videos List */}
      {stats.topFavorited.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            All Favorited Videos
          </h4>
          <div className="space-y-2">
            {stats.topFavorited.map((video, index) => (
              <div
                key={video.videoId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500 w-6">
                    {index + 1}.
                  </span>
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                  <span className="text-sm text-gray-900 font-medium">
                    {video.videoTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-pink-600">
                    {video.favoriteCount}
                  </span>
                  <span className="text-xs text-gray-500">
                    {video.favoriteCount === 1 ? 'favorite' : 'favorites'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
