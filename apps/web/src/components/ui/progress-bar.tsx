/**
 * Progress Bar Component
 * Reusable progress indicator with smooth animations
 */

'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  /** Progress value between 0 and 1 (0% to 100%) */
  progress: number;
  /** Color variant for the progress bar */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Height of the progress bar in pixels */
  height?: number;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Animate progress on mount */
  animated?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Rounded corners */
  rounded?: boolean;
}

const colorClasses = {
  primary: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-500',
  error: 'bg-red-600',
};

const bgColorClasses = {
  primary: 'bg-blue-100',
  success: 'bg-green-100',
  warning: 'bg-yellow-100',
  error: 'bg-red-100',
};

export function ProgressBar({
  progress,
  color = 'primary',
  height = 8,
  showPercentage = false,
  animated = true,
  className = '',
  rounded = true,
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(animated ? 0 : progress);

  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  // Animate progress on mount or when progress changes
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(clampedProgress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(clampedProgress);
    }
  }, [clampedProgress, animated]);

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar container */}
      <div
        className={`relative overflow-hidden ${bgColorClasses[color]} ${
          rounded ? 'rounded-full' : ''
        }`}
        style={{ height: `${height}px` }}
      >
        {/* Progress fill */}
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out ${
            rounded ? 'rounded-full' : ''
          }`}
          style={{
            width: `${displayProgress * 100}%`,
          }}
        />
      </div>

      {/* Percentage text */}
      {showPercentage && (
        <div className="mt-1 text-right text-xs text-gray-600">
          {percentage}%
        </div>
      )}
    </div>
  );
}

/**
 * Video Progress Bar
 * Specialized progress bar for video watch progress with duration info
 */
interface VideoProgressBarProps {
  /** Current position in seconds */
  position: number;
  /** Total duration in seconds */
  duration: number;
  /** Show time remaining */
  showTimeRemaining?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function VideoProgressBar({
  position,
  duration,
  showTimeRemaining = false,
  className = '',
}: VideoProgressBarProps) {
  const progress = duration > 0 ? position / duration : 0;
  const remaining = duration - position;

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Choose color based on progress
  const getColor = () => {
    if (progress >= 0.9) return 'success'; // Near complete
    if (progress >= 0.5) return 'primary'; // In progress
    return 'primary'; // Just started
  };

  return (
    <div className={className}>
      <ProgressBar
        progress={progress}
        color={getColor()}
        height={4}
        rounded={true}
        animated={false}
      />
      {showTimeRemaining && remaining > 0 && (
        <div className="mt-1 text-xs text-gray-600">
          {formatTime(remaining)} remaining
        </div>
      )}
    </div>
  );
}

/**
 * Circular Progress
 * Circular variant of progress indicator
 */
interface CircularProgressProps {
  /** Progress value between 0 and 1 (0% to 100%) */
  progress: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Show percentage in center */
  showPercentage?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const strokeColorClasses = {
  primary: 'stroke-blue-600',
  success: 'stroke-green-600',
  warning: 'stroke-yellow-500',
  error: 'stroke-red-600',
};

export function CircularProgress({
  progress,
  size = 48,
  strokeWidth = 4,
  color = 'primary',
  showPercentage = true,
  className = '',
}: CircularProgressProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - clampedProgress * circumference;

  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${strokeColorClasses[color]} transition-all duration-500 ease-out`}
        />
      </svg>
      {/* Percentage text */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">{percentage}%</span>
        </div>
      )}
    </div>
  );
}
