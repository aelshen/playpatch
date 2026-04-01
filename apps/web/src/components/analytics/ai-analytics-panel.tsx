'use client';

/**
 * AI Analytics Panel Component
 * Displays comprehensive AI conversation analytics in a 4-column grid
 */

import { useEffect, useState } from 'react';
import { MessageSquare, Shield, Zap, TrendingUp } from 'lucide-react';
import { BarChart } from '@/components/charts';
import { ConversationsOverTimeChart } from './conversations-over-time-chart';
import { SafetyTrendsChart } from './safety-trends-chart';
import { AIConversationsTable } from './ai-conversations-table';
import { ParentAIAssistant } from './parent-ai-assistant';

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

export function AIAnalyticsPanel({ profileId, startDate, endDate }: AIAnalyticsPanelProps) {
  const [aiStats, setAIStats] = useState<AIStats | null>(null);
  const [safetyStats, setSafetyStats] = useState<SafetyStats | null>(null);
  const [topics, setTopics] = useState<TopicCount[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
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
        const [statsRes, safetyRes, topicsRes, convsRes] = await Promise.all([
          fetch(`/api/analytics/ai/stats?${params}`),
          fetch(`/api/analytics/ai/safety?${params}`),
          fetch(`/api/analytics/ai/topics?${params}&limit=10`),
          fetch(`/api/analytics/ai/conversations?${params}&limit=50`),
        ]);

        if (!statsRes.ok || !safetyRes.ok || !topicsRes.ok) {
          throw new Error('Failed to fetch AI analytics');
        }

        const [statsData, safetyData, topicsData, convsData] = await Promise.all([
          statsRes.json(),
          safetyRes.json(),
          topicsRes.json(),
          convsRes.ok ? convsRes.json() : Promise.resolve({ conversations: [] }),
        ]);

        setAIStats(statsData);
        setSafetyStats(safetyData);
        setTopics(topicsData.topics || []);
        // Map API shape → table shape
        setConversations(
          (convsData.conversations ?? []).map((c: any) => ({
            ...c,
            hasFlags: c.wasFiltered ?? false,
          }))
        );
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-8 w-1/2 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Topics Discussed */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-700">Topics Discussed</h3>
          </div>

          {topics.length > 0 ? (
            <div className="space-y-2">
              {topics.slice(0, 5).map((topic) => (
                <div key={topic.name} className="flex items-center justify-between">
                  <span className="flex-1 truncate text-sm text-gray-600">{topic.name}</span>
                  <span className="ml-2 text-sm font-semibold text-gray-900">{topic.count}</span>
                </div>
              ))}
              {topics.length > 5 && (
                <p className="mt-2 text-xs text-gray-500">+{topics.length - 5} more topics</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No topics yet</p>
          )}
        </div>

        {/* Conversation Quality */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="text-sm font-semibold text-gray-700">Conversation Quality</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Total Conversations</div>
              <div className="text-2xl font-bold text-gray-900">{aiStats.totalConversations}</div>
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
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">Safety & Filtering</h3>
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
                      i < Math.floor(safetyScore / 20) ? 'text-green-500' : 'text-gray-300'
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
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="text-sm font-semibold text-gray-700">Performance</h3>
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
              <div className="text-lg font-semibold text-gray-700">{aiStats.totalMessages}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Bar Chart (Full Width) */}
      {topicsChartData.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Top Topics Discussed</h3>
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

      {/* Time-Based Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConversationsOverTimeChart profileId={profileId} startDate={startDate} endDate={endDate} />
        <SafetyTrendsChart profileId={profileId} startDate={startDate} endDate={endDate} />
      </div>

      {/* Parent AI Assistant */}
      <ParentAIAssistant profileId={profileId} startDate={startDate} endDate={endDate} />

      {/* Conversations List */}
      <AIConversationsTable conversations={conversations} profiles={[]} />
    </div>
  );
}
