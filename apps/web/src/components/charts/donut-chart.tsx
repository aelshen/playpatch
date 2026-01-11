'use client';

/**
 * Reusable Donut Chart Component
 * Used for distribution visualization (category mix, request types, etc.)
 */

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

export interface DonutChartProps {
  /** Array of data points with name and value */
  data: Array<{ name: string; value: number }>;
  /** Colors for each segment */
  colors?: string[];
  /** Label to display in center of donut */
  centerLabel?: string;
  /** Show legend below chart */
  showLegend?: boolean;
  /** Chart height in pixels */
  height?: number;
  /** Inner radius percentage (0-100, default 60 for donut hole) */
  innerRadiusPercent?: number;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Chart Blue
  '#10B981', // Chart Green
  '#8B5CF6', // Chart Purple
  '#F97316', // Chart Orange
  '#EC4899', // Chart Pink
  '#14B8A6', // Chart Teal
  '#F59E0B', // Chart Yellow
  '#EF4444', // Chart Red
];

export function DonutChart({
  data,
  colors = DEFAULT_COLORS,
  centerLabel,
  showLegend = true,
  height = 300,
  innerRadiusPercent = 60,
}: DonutChartProps) {
  // Calculate percentages
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const dataWithPercentages = data.map((entry) => ({
    ...entry,
    percentage: ((entry.value / total) * 100).toFixed(1),
  }));

  // Label renderer for segments
  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  // Custom center label component
  const renderCenterLabel = () => {
    if (!centerLabel) return null;

    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          fill: '#111827',
        }}
      >
        {centerLabel}
      </text>
    );
  };

  // Custom legend formatter
  const renderLegend = (value: string, entry: any) => {
    const item = dataWithPercentages.find((d) => d.name === value);
    return (
      <span style={{ color: '#374151', fontSize: '0.875rem' }}>
        {value} - {item?.percentage}% ({item?.value})
      </span>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={dataWithPercentages}
          cx="50%"
          cy="50%"
          innerRadius={`${innerRadiusPercent}%`}
          outerRadius="80%"
          fill="#8884d8"
          dataKey="value"
          label={renderLabel}
          labelLine={false}
        >
          {dataWithPercentages.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            backgroundColor: '#374151',
            border: 'none',
            borderRadius: '0.375rem',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value: any, name: string) => {
            const item = dataWithPercentages.find((d) => d.name === name);
            return [
              `${value} (${item?.percentage}%)`,
              name,
            ];
          }}
        />

        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={renderLegend}
            wrapperStyle={{
              fontSize: '0.875rem',
              paddingTop: '1rem',
            }}
          />
        )}

        {/* Center label using SVG text */}
        {renderCenterLabel()}
      </PieChart>
    </ResponsiveContainer>
  );
}
