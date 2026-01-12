'use client';

/**
 * Enhanced KPI Card Component
 * Displays key metrics with trends, sparklines, and comparison support
 */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  change?: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
  };
  sparklineData?: number[];
  comparisonValue?: string | number;
  subtitle?: string;
  format?: 'number' | 'time' | 'percentage' | 'custom';
}

export function KPICardEnhanced({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-500',
  change,
  sparklineData,
  comparisonValue,
  subtitle,
  format = 'number',
}: KPICardProps) {
  // Format value based on type
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'time':
        // Convert seconds to HH:MM:SS or minutes
        const hours = Math.floor(val / 3600);
        const minutes = Math.floor((val % 3600) / 60);
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return val.toLocaleString();
      default:
        return String(val);
    }
  };

  // Determine change color and icon
  const getChangeColor = () => {
    if (!change) return '';
    if (change.trend === 'up') return 'text-green-600';
    if (change.trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (!change) return null;
    if (change.trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (change.trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  // Simple sparkline using SVG
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length === 0) return null;

    const width = 80;
    const height = 24;
    const padding = 2;

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * (width - padding * 2) + padding;
        const y = height - padding - ((val - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg
        width={width}
        height={height}
        className="ml-auto"
        viewBox={`0 0 ${width} ${height}`}
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={iconColor.replace('text-', 'text-opacity-70 ')}
        />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-opacity-10 ${iconColor.replace('text-', 'bg-')}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        {sparklineData && renderSparkline()}
      </div>

      {/* Main Value */}
      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900">
          {formatValue(value)}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
      </div>

      {/* Change Indicator or Comparison */}
      <div className="flex items-center justify-between">
        {change && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${getChangeColor()}`}>
            {getTrendIcon()}
            <span>
              {change.percentage > 0 && '+'}
              {change.percentage.toFixed(1)}%
            </span>
            <span className="text-gray-500 font-normal text-xs">
              ({change.value > 0 && '+'}{formatValue(change.value)})
            </span>
          </div>
        )}

        {comparisonValue !== undefined && !change && (
          <div className="text-sm text-gray-600">
            vs {formatValue(comparisonValue)}
          </div>
        )}
      </div>
    </div>
  );
}
