/**
 * Safety Trends Chart
 * Shows safety flag trends and filter rates over time
 */

'use client';

import { useEffect, useState } from 'react';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SafetyTrendsChartProps {
  profileId: string;
  startDate: Date;
  endDate: Date;
}

interface DailySafetyData {
  date: string;
  totalMessages: number;
  filteredMessages: number;
  filterRate: number;
  flaggedConversations: number;
}

export function SafetyTrendsChart({
  profileId,
  startDate,
  endDate,
}: SafetyTrendsChartProps) {
  const [data, setData] = useState<DailySafetyData[]>([]);
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
          throw new Error('Failed to fetch safety data');
        }

        const result = await response.json();
        const conversations = result.conversations || [];

        // Group by date
        const allDates = eachDayOfInterval({ start: startDate, end: endDate });
        const dailyMap = new Map<string, DailySafetyData>();

        // Initialize all dates
        allDates.forEach((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          dailyMap.set(dateKey, {
            date: format(date, 'MMM d'),
            totalMessages: 0,
            filteredMessages: 0,
            filterRate: 0,
            flaggedConversations: 0,
          });
        });

        // Aggregate safety data per day
        conversations.forEach((conv: any) => {
          const dateKey = format(startOfDay(new Date(conv.startedAt)), 'yyyy-MM-dd');
          const existing = dailyMap.get(dateKey);

          if (existing) {
            existing.totalMessages += conv.messageCount || 0;

            // Count flagged conversations
            if (conv.wasFiltered || conv.hasFlags) {
              existing.flaggedConversations += 1;
            }

            // Estimate filtered messages (would need actual message data for exact count)
            // For now, use a conservative estimate based on filter rate
            if (conv.wasFiltered) {
              existing.filteredMessages += Math.max(1, Math.floor((conv.messageCount || 0) * 0.1));
            }
          }
        });

        // Calculate filter rates
        const processedData = Array.from(dailyMap.values()).map((day) => ({
          ...day,
          filterRate: day.totalMessages > 0
            ? Math.round((day.filteredMessages / day.totalMessages) * 100)
            : 0,
        }));

        setData(processedData);
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
          <p className="text-red-700 text-sm">Error loading safety trends: {error}</p>
        </div>
      </div>
    );
  }

  const hasData = data.some((d) => d.totalMessages > 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Safety Trends</h3>
        <p className="text-sm text-gray-600 mt-1">
          Content filtering and safety flags over time
        </p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorFilterRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
            label={{ value: 'Count / %', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: any, name: string) => {
              if (name === 'Filter Rate') return `${value}%`;
              return value;
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="filterRate"
            stroke="#F59E0B"
            fill="url(#colorFilterRate)"
            strokeWidth={2}
            name="Filter Rate (%)"
          />
          <Area
            type="monotone"
            dataKey="flaggedConversations"
            stroke="#EF4444"
            fill="url(#colorFlagged)"
            strokeWidth={2}
            name="Flagged Conversations"
          />
        </AreaChart>
      </ResponsiveContainer>

      {!hasData && (
        <p className="text-center text-sm text-gray-500 mt-4">
          No safety data found in this date range
        </p>
      )}

      {hasData && (
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-200 pt-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Avg Filter Rate</div>
            <div className="text-lg font-semibold text-yellow-600">
              {(data.reduce((sum, d) => sum + d.filterRate, 0) / data.length).toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Total Flagged</div>
            <div className="text-lg font-semibold text-red-600">
              {data.reduce((sum, d) => sum + d.flaggedConversations, 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Total Messages</div>
            <div className="text-lg font-semibold text-gray-700">
              {data.reduce((sum, d) => sum + d.totalMessages, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
