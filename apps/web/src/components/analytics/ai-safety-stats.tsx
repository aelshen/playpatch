'use client';

/**
 * AI Safety Stats Component
 * Displays comprehensive AI safety and filtering statistics
 */

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { LineChart, DonutChart } from '@/components/charts';

interface SafetyStats {
  totalMessages: number;
  filteredMessages: number;
  filterRate: number;
  flagsByType: Record<string, number>;
  safetyTrends?: Array<{
    date: string;
    flagged: number;
    total: number;
  }>;
}

interface AISafetyStatsProps {
  profileId: string;
  startDate: Date;
  endDate: Date;
}

export function AISafetyStats({
  profileId,
  startDate,
  endDate,
}: AISafetyStatsProps) {
  const [stats, setStats] = useState<SafetyStats | null>(null);
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

        const res = await fetch(`/api/analytics/ai/safety?${params}`);

        if (!res.ok) {
          throw new Error('Failed to fetch safety stats');
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
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Error loading safety stats: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate safety score (inverse of filter rate)
  const safetyScore = Math.max(0, 100 - stats.filterRate);

  // Determine safety level
  const getSafetyLevel = (score: number) => {
    if (score >= 95) return { label: 'Excellent', color: 'green' };
    if (score >= 85) return { label: 'Good', color: 'blue' };
    if (score >= 70) return { label: 'Moderate', color: 'yellow' };
    return { label: 'Needs Attention', color: 'red' };
  };

  const safetyLevel = getSafetyLevel(safetyScore);

  // Prepare flag types for donut chart
  const flagsData = Object.entries(stats.flagsByType || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare trend data for line chart
  const trendData =
    stats.safetyTrends?.map((trend) => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      filterRate: trend.total > 0 ? (trend.flagged / trend.total) * 100 : 0,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Safety & Filtering Analytics
            </h3>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              safetyLevel.color === 'green'
                ? 'bg-green-100 text-green-700'
                : safetyLevel.color === 'blue'
                ? 'bg-blue-100 text-blue-700'
                : safetyLevel.color === 'yellow'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {safetyLevel.label}
          </div>
        </div>

        {/* Safety Score Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-700 font-semibold mb-1">
                Safety Score
              </div>
              <div className="text-4xl font-bold text-blue-900">
                {safetyScore.toFixed(1)}%
              </div>
              <div className="text-sm text-blue-600 mt-2">
                {stats.totalMessages - stats.filteredMessages} safe messages out of {stats.totalMessages}
              </div>
            </div>
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#E0E7FF"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={
                    safetyLevel.color === 'green'
                      ? '#10B981'
                      : safetyLevel.color === 'blue'
                      ? '#3B82F6'
                      : safetyLevel.color === 'yellow'
                      ? '#F59E0B'
                      : '#EF4444'
                  }
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(safetyScore / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {safetyLevel.color === 'green' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : safetyLevel.color === 'red' ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : (
                  <Shield className="w-8 h-8 text-blue-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filter Rate */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">Filter Rate</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.filterRate.toFixed(1)}%
                </div>
              </div>
              <TrendingDown className="w-5 h-5 text-green-500" />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Lower is better
            </div>
          </div>

          {/* Filtered Messages */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Filtered Messages</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.filteredMessages}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Out of {stats.totalMessages} total
            </div>
          </div>

          {/* Safe Messages */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">Safe Messages</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalMessages - stats.filteredMessages}
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {((stats.totalMessages - stats.filteredMessages) / stats.totalMessages * 100).toFixed(1)}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Flag Types and Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flag Types Distribution */}
        {flagsData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Filter Reasons
            </h4>
            <DonutChart
              data={flagsData}
              height={250}
              centerLabel={`${stats.filteredMessages}`}
              showLegend={true}
            />
            <div className="mt-4 space-y-2">
              {flagsData.map((flag) => (
                <div
                  key={flag.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 capitalize">
                    {flag.name.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {flag.value} ({((flag.value / stats.filteredMessages) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Trend */}
        {trendData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Filter Rate Trend
            </h4>
            <LineChart
              data={trendData}
              xKey="date"
              yKeys={['filterRate']}
              colors={['#EF4444']}
              height={250}
              showGrid={true}
              showLegend={false}
              formatYAxis={(value) => `${value}%`}
            />
            <div className="mt-4 text-xs text-gray-500">
              Lower trend indicates improved content safety over time
            </div>
          </div>
        )}
      </div>

      {/* Safety Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-blue-900 mb-1">
              Safety Insights
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              {stats.filterRate < 5 && (
                <li>Excellent safety performance. Content filtering is working effectively.</li>
              )}
              {stats.filterRate >= 5 && stats.filterRate < 15 && (
                <li>Good safety levels. Monitor trends to maintain this performance.</li>
              )}
              {stats.filterRate >= 15 && (
                <li>Consider reviewing content settings and filter sensitivity.</li>
              )}
              {flagsData.length > 0 && (
                <li>
                  Most common filter reason: {flagsData[0].name.replace(/_/g, ' ')} ({flagsData[0].value} occurrences)
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
