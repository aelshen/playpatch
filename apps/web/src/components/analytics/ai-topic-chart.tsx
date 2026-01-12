'use client';

/**
 * AI Topic Chart Component
 * Displays topics discussed in AI conversations with interactive visualization
 */

import { useState, useEffect } from 'react';
import { BarChart } from '@/components/charts';
import { MessageSquare, TrendingUp } from 'lucide-react';

interface TopicCount {
  name: string;
  count: number;
}

interface AITopicChartProps {
  profileId: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
  onTopicClick?: (topic: string) => void;
}

export function AITopicChart({
  profileId,
  startDate,
  endDate,
  limit = 20,
  onTopicClick,
}: AITopicChartProps) {
  const [topics, setTopics] = useState<TopicCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          profileId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: limit.toString(),
        });

        const res = await fetch(`/api/analytics/ai/topics?${params}`);

        if (!res.ok) {
          throw new Error('Failed to fetch topics');
        }

        const data = await res.json();
        setTopics(data.topics || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopics();
  }, [profileId, startDate, endDate, limit]);

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic === selectedTopic ? null : topic);
    if (onTopicClick) {
      onTopicClick(topic);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Error loading topics: {error}</p>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Topics Discussed
          </h3>
        </div>
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No topics discussed yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Topics will appear here once AI conversations begin
          </p>
        </div>
      </div>
    );
  }

  // Prepare data for bar chart
  const chartData = topics.map((topic) => ({
    topic: topic.name,
    count: topic.count,
  }));

  // Calculate total mentions
  const totalMentions = topics.reduce((sum, t) => sum + t.count, 0);

  // Find top trending topic (highest count)
  const topTopic = topics[0];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Topics Discussed
          </h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {topics.length}
          </div>
          <div className="text-xs text-gray-500">Total Topics</div>
        </div>
      </div>

      {/* Top Topic Card */}
      {topTopic && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-purple-900 font-semibold">
                Most Discussed Topic
              </div>
              <div className="text-lg font-bold text-purple-700 mt-1">
                {topTopic.name}
              </div>
              <div className="text-sm text-purple-600 mt-1">
                {topTopic.count} mentions ({((topTopic.count / totalMentions) * 100).toFixed(1)}% of all conversations)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart */}
      <div className="mb-4">
        <BarChart
          data={chartData}
          xKey="topic"
          yKeys={['count']}
          horizontal={true}
          showValues={true}
          showLegend={false}
          height={Math.max(280, topics.length * 30)}
          colors={['#8B5CF6']}
        />
      </div>

      {/* Topic List with Percentages */}
      <div className="space-y-2">
        {topics.slice(0, 10).map((topic, index) => {
          const percentage = (topic.count / totalMentions) * 100;
          const isSelected = selectedTopic === topic.name;

          return (
            <button
              key={topic.name}
              onClick={() => handleTopicClick(topic.name)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-purple-100 border-2 border-purple-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">
                  {index + 1}. {topic.name}
                </span>
                <span className="text-sm font-bold text-purple-600">
                  {topic.count}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {percentage.toFixed(1)}% of total mentions
              </div>
            </button>
          );
        })}
      </div>

      {/* Show More Indicator */}
      {topics.length > 10 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            +{topics.length - 10} more topics
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {topics.length}
            </div>
            <div className="text-xs text-gray-500">Unique Topics</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {totalMentions}
            </div>
            <div className="text-xs text-gray-500">Total Mentions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {(totalMentions / topics.length).toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Avg per Topic</div>
          </div>
        </div>
      </div>
    </div>
  );
}
