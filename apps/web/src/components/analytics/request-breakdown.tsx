'use client';

/**
 * Request Breakdown Component
 * Displays content request statistics and analysis
 */

import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import { DonutChart, LineChart, BarChart } from '@/components/charts';

interface RequestStats {
  totalRequests: number;
  requestsByType: Record<string, number>;
  fulfillmentRate: number;
  pendingRequests: number;
  topRequestedTopics: string[];
  requestTrend: Array<{ date: string; count: number }>;
}

interface RequestBreakdownProps {
  profileId: string;
  startDate: Date;
  endDate: Date;
}

export function RequestBreakdown({
  profileId,
  startDate,
  endDate,
}: RequestBreakdownProps) {
  const [stats, setStats] = useState<RequestStats | null>(null);
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

        const res = await fetch(`/api/analytics/interactions/requests?${params}`);

        if (!res.ok) {
          throw new Error('Failed to fetch request stats');
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
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
        <p className="text-red-700">Error loading requests: {error}</p>
      </div>
    );
  }

  if (!stats || stats.totalRequests === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Content Requests</h3>
        </div>
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No content requests yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Child requests for content will appear here
          </p>
        </div>
      </div>
    );
  }

  // Format request type labels
  const formatRequestType = (type: string): string => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Prepare request types for donut chart
  const requestTypeData = Object.entries(stats.requestsByType)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      name: formatRequestType(type),
      value: count,
    }));

  // Prepare trend data
  const trendData = stats.requestTrend.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    requests: item.count,
  }));

  // Prepare top topics for bar chart
  const topicsData = stats.topRequestedTopics.slice(0, 10).map((topic) => ({
    topic: topic.length > 25 ? topic.substring(0, 25) + '...' : topic,
    count: 1, // We could enhance this to show actual counts
  }));

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Content Requests Analytics
          </h3>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Requests */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-purple-700 font-semibold mb-1">
                  Total Requests
                </div>
                <div className="text-3xl font-bold text-purple-900">
                  {stats.totalRequests}
                </div>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          {/* Fulfillment Rate */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-green-700 font-semibold mb-1">
                  Fulfillment Rate
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {stats.fulfillmentRate.toFixed(0)}%
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-yellow-700 font-semibold mb-1">
                  Pending
                </div>
                <div className="text-3xl font-bold text-yellow-900">
                  {stats.pendingRequests}
                </div>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          {/* Fulfilled Count */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-blue-700 font-semibold mb-1">
                  Fulfilled
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {Math.round((stats.totalRequests * stats.fulfillmentRate) / 100)}
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600 fill-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Request Type Distribution and Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Types Donut Chart */}
        {requestTypeData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Request Types
            </h4>
            <DonutChart
              data={requestTypeData}
              height={250}
              centerLabel={`${stats.totalRequests}`}
              showLegend={true}
            />
          </div>
        )}

        {/* Request Trend Line Chart */}
        {trendData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Requests Over Time
            </h4>
            <LineChart
              data={trendData}
              xKey="date"
              yKeys={['requests']}
              colors={['#8B5CF6']}
              height={250}
              showArea={true}
              showGrid={true}
              showLegend={false}
            />
          </div>
        )}
      </div>

      {/* Top Requested Topics */}
      {stats.topRequestedTopics.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h4 className="text-sm font-semibold text-gray-900">
              Top Requested Topics
            </h4>
          </div>
          <div className="space-y-2">
            {stats.topRequestedTopics.map((topic, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-purple-600 w-6">
                    {index + 1}.
                  </span>
                  <span className="text-sm text-gray-900 font-medium capitalize">
                    {topic}
                  </span>
                </div>
                <MessageSquare className="w-4 h-4 text-purple-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fulfillment Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-blue-900 mb-1">
              Fulfillment Insights
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              {stats.fulfillmentRate >= 80 && (
                <li>Excellent fulfillment rate! Keep up the great work responding to requests.</li>
              )}
              {stats.fulfillmentRate >= 50 && stats.fulfillmentRate < 80 && (
                <li>Good fulfillment rate. Consider prioritizing pending requests to improve satisfaction.</li>
              )}
              {stats.fulfillmentRate < 50 && (
                <li>Fulfillment rate could be improved. Review pending requests and take action.</li>
              )}
              {stats.pendingRequests > 0 && (
                <li>
                  You have {stats.pendingRequests} pending {stats.pendingRequests === 1 ? 'request' : 'requests'} waiting for review.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
