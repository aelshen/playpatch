/**
 * Time Remaining Badge Component
 * Displays time remaining for the day based on profile time limits
 */

'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatTimeRemaining, getTimeBadgeColor } from '@/lib/utils/time-limits';

interface TimeRemainingBadgeProps {
  profileId: string;
  initialMinutesRemaining: number | null;
  className?: string;
}

export function TimeRemainingBadge({
  profileId,
  initialMinutesRemaining,
  className = '',
}: TimeRemainingBadgeProps) {
  const [minutesRemaining, setMinutesRemaining] = useState(initialMinutesRemaining);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Refresh time remaining every minute
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const response = await fetch(`/api/profiles/${profileId}/time-remaining`);
        if (response.ok) {
          const data = await response.json();
          setMinutesRemaining(data.minutesRemaining);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('Failed to refresh time remaining:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [profileId]);

  // No time limit set
  if (minutesRemaining === null) {
    return null;
  }

  const displayText = formatTimeRemaining(minutesRemaining);
  const color = getTimeBadgeColor(minutesRemaining);

  // Color classes
  const colorClasses = {
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  const selectedColor = color ? colorClasses[color] : colorClasses.green;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${selectedColor} ${className} ${hasError ? 'opacity-60' : ''}`}
      title={hasError ? 'Unable to refresh time remaining' : `Time limit: ${displayText}`}
    >
      <Clock className={`h-4 w-4 ${hasError ? 'animate-pulse' : ''}`} />
      <span className={isLoading ? 'opacity-50' : ''}>{displayText}</span>
      {hasError && (
        <span className="text-xs" title="Failed to update">
          ⚠
        </span>
      )}
    </div>
  );
}
