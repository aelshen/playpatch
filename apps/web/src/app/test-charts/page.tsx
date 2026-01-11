'use client';

/**
 * Test Page for Phase 1 Components
 * Showcases all chart components and date range picker
 */

import { useState } from 'react';
import { LineChart, BarChart, DonutChart, Heatmap } from '@/components/charts';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { subDays } from 'date-fns';

export default function TestChartsPage() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  // Sample data for Line Chart (watch time over 7 days)
  const lineChartData = [
    { date: 'Mon', watchTime: 2.5, aiChats: 3 },
    { date: 'Tue', watchTime: 3.2, aiChats: 5 },
    { date: 'Wed', watchTime: 2.8, aiChats: 2 },
    { date: 'Thu', watchTime: 4.1, aiChats: 6 },
    { date: 'Fri', watchTime: 3.7, aiChats: 4 },
    { date: 'Sat', watchTime: 5.2, aiChats: 8 },
    { date: 'Sun', watchTime: 4.8, aiChats: 7 },
  ];

  // Sample data for Bar Chart (top topics)
  const barChartData = [
    { topic: 'Dinosaurs', count: 15 },
    { topic: 'Space', count: 12 },
    { topic: 'Ocean', count: 10 },
    { topic: 'Animals', count: 8 },
    { topic: 'Science', count: 6 },
  ];

  // Sample data for Donut Chart (category distribution)
  const donutChartData = [
    { name: 'Educational', value: 45 },
    { name: 'Entertainment', value: 35 },
    { name: 'Documentary', value: 20 },
  ];

  // Sample data for Heatmap (viewing patterns)
  const heatmapData = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Simulate viewing patterns (more activity in evening)
      let value = 0;
      if (hour >= 16 && hour <= 20) {
        value = Math.floor(Math.random() * 120) + 60; // 60-180 minutes
      } else if (hour >= 9 && hour <= 15) {
        value = Math.floor(Math.random() * 60) + 20; // 20-80 minutes
      } else {
        value = Math.floor(Math.random() * 30); // 0-30 minutes
      }

      heatmapData.push({ day, hour, value });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Phase 1 Components Test
          </h1>
          <p className="text-gray-600">
            Testing chart components and date range picker from Phase 1
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Date Range Picker
          </h2>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <p className="mt-4 text-sm text-gray-600">
            Selected: {dateRange.start.toLocaleDateString()} -{' '}
            {dateRange.end.toLocaleDateString()}
          </p>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Line Chart - Watch Time & AI Chats Over Week
          </h2>
          <LineChart
            data={lineChartData}
            xKey="date"
            yKeys={['watchTime', 'aiChats']}
            height={320}
            showArea={true}
            showLegend={true}
            showGrid={true}
            formatTooltip={(value) => {
              if (typeof value === 'number') {
                return value >= 10 ? `${value} chats` : `${value}h`;
              }
              return String(value);
            }}
          />
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bar Chart - Top Topics Discussed
          </h2>
          <BarChart
            data={barChartData}
            xKey="topic"
            yKeys={['count']}
            horizontal={true}
            showValues={true}
            showLegend={false}
            height={280}
          />
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Donut Chart - Content Category Mix
          </h2>
          <div className="flex justify-center">
            <DonutChart
              data={donutChartData}
              centerLabel="100 videos"
              showLegend={true}
              height={300}
            />
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Heatmap - Viewing Patterns (Day × Hour)
          </h2>
          <div className="overflow-x-auto">
            <Heatmap
              data={heatmapData}
              showTooltip={true}
              formatValue={(value) => `${value} min`}
              onCellClick={(day, hour) => {
                alert(`Clicked: Day ${day}, Hour ${hour}`);
              }}
            />
          </div>
        </div>

        {/* Component Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Components Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-gray-700 mt-2">LineChart</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-gray-700 mt-2">BarChart</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-gray-700 mt-2">DonutChart</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-gray-700 mt-2">Heatmap</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
