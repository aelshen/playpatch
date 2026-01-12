'use client';

/**
 * AI Analytics Panel Component
 * Displays comprehensive AI conversation analytics in a 4-column grid
 */

import { useEffect, useState } from 'react';
import { MessageSquare, Shield, Zap, TrendingUp } from 'lucide-react';
import { BarChart } from '@/components/charts';

interface AIStats {
  totalConversations: number;
  totalMessages: number;
  avgConversationLength: number;
  avgResponseTime: number;
  filterRate: number;
  totalTokensUsed: number;
  topicsDiscussed: string[];
}

interface SafetyStats {
  totalMessages: number;
  filteredMessages: number;
  filterRate: number;
  flagsByType: Record<string, number>;
}

interface TopicCount {
  name: string;
  count: number;
}

interface AIAnalyticsPanelProps {
  profileId: string;
  startDate: Date;
  endDate: Date;
}

export function AIAnalyticsPanel({
  profileId,
  startDate,
  endDate,
}: AIAnalyticsPanelProps) {
  const [aiStats, setAIStats] = useState<AIStats | null>(null);
  const [safetyStats, setSafetyStats] = useState<SafetyStats | null>(null);
  const [topics, setTopics] = useState<TopicCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          profileId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        // Fetch all AI analytics data in parallel
        const [statsRes, safetyRes, topicsRes] = await Promise.all([
          fetch(`/api/analytics/ai/stats?${params}`),
          fetch(`/api/analytics/ai/safety?${params}`),
          fetch(`/api/analytics/ai/topics?${params}&limit=10`),
        ]);

        if (!statsRes.ok || !safetyRes.ok || !topicsRes.ok) {
          throw new Error('Failed to fetch AI analytics');
        }

        const [statsData, safetyData, topicsData] = await Promise.all([
          statsRes.json(),
          safetyRes.json(),
          topicsRes.json(),
        ]);

        setAIStats(statsData);
        setSafetyStats(safetyData);
        setTopics(topicsData.topics || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [profileId, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Error loading AI analytics: {error}</p>
      </div>
    );
  }

  if (!aiStats || !safetyStats) {
    return null;
  }

  // Prepare data for topics bar chart
  const topicsChartData = topics.map((topic) => ({
    topic: topic.name,
    count: topic.count,
  }));

  // Calculate safety score (inverse of filter rate)
  const safetyScore = 100 - safetyStats.filterRate;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">AI Chat Analytics</h2>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Topics Discussed */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Topics Discussed
            </h3>
          </div>

          {topics.length > 0 ? (
            <div className="space-y-2">
              {topics.slice(0, 5).map((topic) => (
                <div key={topic.name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate flex-1">
                    {topic.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 ml-2">
                    {topic.count}
                  </span>
                </div>
              ))}
              {topics.length > 5 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{topics.length - 5} more topics
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No topics yet</p>
          )}
        </div>

        {/* Conversation Quality */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Conversation Quality
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Total Conversations</div>
              <div className="text-2xl font-bold text-gray-900">
                {aiStats.totalConversations}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Avg Messages/Conv</div>
              <div className="text-lg font-semibold text-gray-700">
                {aiStats.avgConversationLength.toFixed(1)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Engagement</div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < Math.min(Math.floor(aiStats.avgConversationLength), 5)
                        ? 'text-green-500'
                        : 'text-gray-300'
                    }
                  >
                    ●
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Safety & Filtering */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Safety & Filtering
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Filter Rate</div>
              <div className="text-2xl font-bold text-gray-900">
                {safetyStats.filterRate.toFixed(1)}%
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Filtered Messages</div>
              <div className="text-lg font-semibold text-gray-700">
                {safetyStats.filteredMessages} / {safetyStats.totalMessages}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Safety Score</div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < Math.floor(safetyScore / 20)
                        ? 'text-green-500'
                        : 'text-gray-300'
                    }
                  >
                    ●
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Performance
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Avg Response Time</div>
              <div className="text-2xl font-bold text-gray-900">
                {(aiStats.avgResponseTime / 1000).toFixed(2)}s
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Total Tokens</div>
              <div className="text-lg font-semibold text-gray-700">
                {aiStats.totalTokensUsed.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Total Messages</div>
              <div className="text-lg font-semibold text-gray-700">
                {aiStats.totalMessages}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Bar Chart (Full Width) */}
      {topicsChartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Topics Discussed
          </h3>
          <BarChart
            data={topicsChartData}
            xKey="topic"
            yKeys={['count']}
            horizontal={true}
            showValues={true}
            showLegend={false}
            height={280}
            colors={['#8B5CF6']}
          />
        </div>
      )}
    </div>
  );
}
