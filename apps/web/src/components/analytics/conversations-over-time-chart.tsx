/**
 * Conversations Over Time Chart
 * Line chart showing conversation trends over the selected date range
 */

'use client';

import { useEffect, useState } from 'react';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ConversationsOverTimeChartProps {
  profileId: string;
  startDate: Date;
  endDate: Date;
}

interface DailyData {
  date: string;
  conversations: number;
  messages: number;
  flagged: number;
}

export function ConversationsOverTimeChart({
  profileId,
  startDate,
  endDate,
}: ConversationsOverTimeChartProps) {
  const [data, setData] = useState<DailyData[]>([]);
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

        const response = await fetch(`/api/analytics/ai/conversations?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const result = await response.json();
        const conversations = result.conversations || [];

        // Group conversations by date
        const allDates = eachDayOfInterval({ start: startDate, end: endDate });
        const dailyMap = new Map<string, DailyData>();

        // Initialize all dates with 0
        allDates.forEach((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          dailyMap.set(dateKey, {
            date: format(date, 'MMM d'),
            conversations: 0,
            messages: 0,
            flagged: 0,
          });
        });

        // Count conversations per day
        conversations.forEach((conv: any) => {
          const dateKey = format(startOfDay(new Date(conv.startedAt)), 'yyyy-MM-dd');
          const existing = dailyMap.get(dateKey);

          if (existing) {
            existing.conversations += 1;
            existing.messages += conv.messageCount || 0;
            if (conv.wasFiltered || conv.hasFlags) {
              existing.flagged += 1;
            }
          }
        });

        setData(Array.from(dailyMap.values()));
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700 text-sm">Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Conversations Over Time</h3>
        <p className="text-sm text-gray-600 mt-1">
          Daily conversation and message trends
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="conversations"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Conversations"
          />
          <Line
            type="monotone"
            dataKey="messages"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Messages"
          />
          <Line
            type="monotone"
            dataKey="flagged"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: '#F59E0B', r: 4 }}
            activeDot={{ r: 6 }}
            name="Flagged"
          />
        </LineChart>
      </ResponsiveContainer>

      {data.every((d) => d.conversations === 0) && (
        <p className="text-center text-sm text-gray-500 mt-4">
          No conversations found in this date range
        </p>
      )}
    </div>
  );
}
