'use client';

/**
 * Reusable Line Chart Component
 * Used for time-series data visualization (watch time trends, AI usage over time, etc.)
 */

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

export interface LineChartProps {
  /** Array of data points with x and y values */
  data: Array<{ [key: string]: any }>;
  /** Key for X-axis values */
  xKey: string;
  /** Keys for Y-axis values (supports multiple lines) */
  yKeys: string[];
  /** Colors for each line (defaults to blue-green palette) */
  colors?: string[];
  /** Chart height in pixels */
  height?: number;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Show area fill under line */
  showArea?: boolean;
  /** Y-axis label */
  yAxisLabel?: string;
  /** X-axis label */
  xAxisLabel?: string;
  /** Format function for tooltip values */
  formatTooltip?: (value: any) => string;
  /** Format function for Y-axis ticks */
  formatYAxis?: (value: any) => string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Chart Blue
  '#10B981', // Chart Green
  '#8B5CF6', // Chart Purple
  '#F97316', // Chart Orange
  '#EC4899', // Chart Pink
  '#14B8A6', // Chart Teal
];

export function LineChart({
  data,
  xKey,
  yKeys,
  colors = DEFAULT_COLORS,
  height = 320,
  showGrid = true,
  showLegend = true,
  showArea = false,
  yAxisLabel,
  xAxisLabel,
  formatTooltip,
  formatYAxis,
}: LineChartProps) {
  const ChartComponent = showArea ? AreaChart : RechartsLineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        )}

        <XAxis
          dataKey={xKey}
          stroke="#6B7280"
          style={{ fontSize: '0.875rem' }}
          label={
            xAxisLabel
              ? {
                  value: xAxisLabel,
                  position: 'insideBottom',
                  offset: -5,
                  style: { fontSize: '0.875rem', fill: '#6B7280' },
                }
              : undefined
          }
        />

        <YAxis
          stroke="#6B7280"
          style={{ fontSize: '0.875rem' }}
          tickFormatter={formatYAxis}
          label={
            yAxisLabel
              ? {
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '0.875rem', fill: '#6B7280' },
                }
              : undefined
          }
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#374151',
            border: 'none',
            borderRadius: '0.375rem',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={formatTooltip}
        />

        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: '0.875rem' }}
            iconType="line"
          />
        )}

        {yKeys.map((key, index) => {
          const color = colors[index % colors.length];

          if (showArea) {
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                fill={color}
                fillOpacity={0.1}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            );
          }

          return (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          );
        })}
      </ChartComponent>
    </ResponsiveContainer>
  );
}
