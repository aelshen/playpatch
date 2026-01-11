'use client';

/**
 * Custom Heatmap Component
 * Used for viewing patterns (day/hour grid showing watch intensity)
 */

import { useState } from 'react';

export interface HeatmapDataPoint {
  /** Day of week (0=Sunday, 6=Saturday) */
  day: number;
  /** Hour of day (0-23) */
  hour: number;
  /** Value for intensity (e.g., watch time in minutes) */
  value: number;
}

export interface HeatmapProps {
  /** Array of data points with day, hour, and value */
  data: HeatmapDataPoint[];
  /** Color scheme [low, medium, high] */
  colorScheme?: [string, string, string];
  /** Size of each cell in pixels */
  cellSize?: number;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Callback when cell is clicked */
  onCellClick?: (day: number, hour: number) => void;
  /** Format function for tooltip value */
  formatValue?: (value: number) => string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_COLOR_SCHEME: [string, string, string] = [
  '#E0F2FE', // Light blue (low)
  '#3B82F6', // Chart blue (medium)
  '#1E40AF', // Dark blue (high)
];

export function Heatmap({
  data,
  colorScheme = DEFAULT_COLOR_SCHEME,
  cellSize = 40,
  showTooltip = true,
  onCellClick,
  formatValue = (value) => value.toString(),
}: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    day: number;
    hour: number;
    value: number;
  } | null>(null);

  // Find min and max values for color interpolation
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Get color for a value using linear interpolation
  const getColor = (value: number): string => {
    if (maxValue === minValue) return colorScheme[1];

    const normalized = (value - minValue) / (maxValue - minValue);

    if (normalized < 0.33) {
      // Low range
      return colorScheme[0];
    } else if (normalized < 0.67) {
      // Medium range
      return colorScheme[1];
    } else {
      // High range
      return colorScheme[2];
    }
  };

  // Create a map for quick lookup
  const dataMap = new Map(
    data.map((d) => [`${d.day}-${d.hour}`, d.value])
  );

  // Generate hour labels (every 3 hours)
  const hourLabels = Array.from({ length: 8 }, (_, i) => i * 3);

  const gap = 2;
  const labelWidth = 50;
  const labelHeight = 30;
  const totalWidth = labelWidth + 24 * (cellSize + gap);
  const totalHeight = labelHeight + 7 * (cellSize + gap);

  return (
    <div className="relative">
      <svg
        width={totalWidth}
        height={totalHeight}
        className="overflow-visible"
      >
        {/* Hour labels (top) */}
        {hourLabels.map((hour) => {
          const x = labelWidth + hour * (cellSize + gap) + cellSize / 2;
          return (
            <text
              key={`hour-${hour}`}
              x={x}
              y={20}
              textAnchor="middle"
              fontSize="12"
              fill="#6B7280"
            >
              {hour}:00
            </text>
          );
        })}

        {/* Day labels (left) */}
        {DAY_LABELS.map((label, day) => {
          const y = labelHeight + day * (cellSize + gap) + cellSize / 2;
          return (
            <text
              key={`day-${day}`}
              x={labelWidth - 10}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="12"
              fill="#6B7280"
            >
              {label}
            </text>
          );
        })}

        {/* Heatmap cells */}
        {Array.from({ length: 7 }, (_, day) =>
          Array.from({ length: 24 }, (_, hour) => {
            const key = `${day}-${hour}`;
            const value = dataMap.get(key) || 0;
            const x = labelWidth + hour * (cellSize + gap);
            const y = labelHeight + day * (cellSize + gap);
            const color = value > 0 ? getColor(value) : '#F3F4F6';

            return (
              <rect
                key={key}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill={color}
                rx={2}
                className="transition-all cursor-pointer hover:opacity-80 hover:scale-105"
                onMouseEnter={() =>
                  showTooltip && setHoveredCell({ day, hour, value })
                }
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => onCellClick?.(day, hour)}
              />
            );
          })
        )}
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredCell && (
        <div
          className="absolute bg-gray-800 text-white text-sm px-3 py-2 rounded-md shadow-lg pointer-events-none z-10"
          style={{
            top: labelHeight + hoveredCell.day * (cellSize + gap) + cellSize + 5,
            left: labelWidth + hoveredCell.hour * (cellSize + gap),
          }}
        >
          <div className="font-semibold">
            {DAY_LABELS[hoveredCell.day]} {hoveredCell.hour}:00
          </div>
          <div>{formatValue(hoveredCell.value)}</div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
        <span>Low</span>
        <div className="flex gap-1">
          <div
            className="w-6 h-4 rounded"
            style={{ backgroundColor: colorScheme[0] }}
          />
          <div
            className="w-6 h-4 rounded"
            style={{ backgroundColor: colorScheme[1] }}
          />
          <div
            className="w-6 h-4 rounded"
            style={{ backgroundColor: colorScheme[2] }}
          />
        </div>
        <span>High</span>
      </div>
    </div>
  );
}
