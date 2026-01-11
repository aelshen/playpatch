'use client';

/**
 * Reusable Bar Chart Component
 * Used for categorical comparisons (children, videos, categories, etc.)
 */

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface BarChartProps {
  /** Array of data points */
  data: Array<{ [key: string]: any }>;
  /** Key for X-axis (category) values */
  xKey: string;
  /** Keys for Y-axis values (supports multiple series) */
  yKeys: string[];
  /** Colors for each bar series */
  colors?: string[];
  /** Chart height in pixels */
  height?: number;
  /** Show as horizontal bars */
  horizontal?: boolean;
  /** Stack bars instead of grouping */
  stacked?: boolean;
  /** Show values on bars */
  showValues?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  /** Format function for tooltip values */
  formatTooltip?: (value: any) => string;
  /** Format function for axis values */
  formatAxis?: (value: any) => string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Chart Blue
  '#10B981', // Chart Green
  '#8B5CF6', // Chart Purple
  '#F97316', // Chart Orange
  '#EC4899', // Chart Pink
  '#14B8A6', // Chart Teal
];

export function BarChart({
  data,
  xKey,
  yKeys,
  colors = DEFAULT_COLORS,
  height = 280,
  horizontal = false,
  stacked = false,
  showValues = false,
  showLegend = true,
  showGrid = true,
  formatTooltip,
  formatAxis,
}: BarChartProps) {
  // Value label renderer
  const renderLabel = (props: any) => {
    const { x, y, width, height, value } = props;

    if (horizontal) {
      return (
        <text
          x={x + width + 5}
          y={y + height / 2}
          fill="#6B7280"
          textAnchor="start"
          dominantBaseline="middle"
          fontSize="0.75rem"
        >
          {formatAxis ? formatAxis(value) : value}
        </text>
      );
    }

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#6B7280"
        textAnchor="middle"
        fontSize="0.75rem"
      >
        {formatAxis ? formatAxis(value) : value}
      </text>
    );
  };

  const chartProps = {
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    layout: horizontal ? ('horizontal' as const) : ('vertical' as const),
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart {...chartProps}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        )}

        {horizontal ? (
          <>
            <XAxis
              type="number"
              stroke="#6B7280"
              style={{ fontSize: '0.875rem' }}
              tickFormatter={formatAxis}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              stroke="#6B7280"
              style={{ fontSize: '0.875rem' }}
              width={100}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              stroke="#6B7280"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: '0.875rem' }}
              tickFormatter={formatAxis}
            />
          </>
        )}

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

        {showLegend && yKeys.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: '0.875rem' }}
            iconType="rect"
          />
        )}

        {yKeys.map((key, index) => {
          const color = colors[index % colors.length];

          return (
            <Bar
              key={key}
              dataKey={key}
              fill={color}
              stackId={stacked ? 'stack' : undefined}
              label={showValues ? renderLabel : undefined}
              radius={[4, 4, 0, 0]}
            >
              {/* Add hover effect with darker shade */}
              {data.map((_, entryIndex) => (
                <Cell
                  key={`cell-${entryIndex}`}
                  fill={color}
                  opacity={0.9}
                />
              ))}
            </Bar>
          );
        })}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
