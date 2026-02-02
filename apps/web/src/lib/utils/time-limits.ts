/**
 * Time Limits Utility Functions
 * Calculate and format time remaining for child profiles
 */

import { prisma } from '@/lib/db/client';

/**
 * Time limit structure stored in ChildProfile.timeLimits JSON field
 */
export interface TimeLimits {
  weekday?: number; // minutes per day on weekdays (Mon-Fri)
  weekend?: number; // minutes per day on weekends (Sat-Sun)
  daily?: number; // universal daily limit (if not using weekday/weekend)
}

/**
 * Get today's time limit for a profile
 */
export function getTodayTimeLimit(timeLimits: TimeLimits | null): number | null {
  if (!timeLimits) return null;

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Use daily limit if set
  if (timeLimits.daily) {
    return timeLimits.daily;
  }

  // Use weekday/weekend specific limits
  if (isWeekend && timeLimits.weekend) {
    return timeLimits.weekend;
  }

  if (!isWeekend && timeLimits.weekday) {
    return timeLimits.weekday;
  }

  // No limit set for today
  return null;
}

/**
 * Get time used today for a child profile (in minutes)
 */
export async function getTimeUsedToday(childId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sessions = await prisma.watchSession.findMany({
    where: {
      childId,
      startedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    select: {
      duration: true, // in seconds
    },
  });

  // Sum up all durations and convert to minutes
  const totalSeconds = sessions.reduce((sum, session) => sum + session.duration, 0);
  return Math.floor(totalSeconds / 60);
}

/**
 * Calculate time remaining today (in minutes)
 * Returns null if no limit is set
 * Returns negative number if over limit
 */
export async function getTimeRemainingToday(
  childId: string,
  timeLimits: TimeLimits | null
): Promise<number | null> {
  const todayLimit = getTodayTimeLimit(timeLimits);
  if (todayLimit === null) return null;

  const usedMinutes = await getTimeUsedToday(childId);
  return todayLimit - usedMinutes;
}

/**
 * Format time remaining for display
 * Examples:
 *   - 125 minutes -> "2 hours 5 min left"
 *   - 45 minutes -> "45 min left"
 *   - 5 minutes -> "5 min left"
 *   - -10 minutes -> "Time's up"
 *   - null -> null (no limit)
 */
export function formatTimeRemaining(minutes: number | null): string | null {
  if (minutes === null) return null;

  if (minutes <= 0) {
    return "Time's up";
  }

  if (minutes < 60) {
    return `${minutes} min left`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
  }

  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} min left`;
}

/**
 * Get badge color based on remaining time
 * - green: > 60 minutes
 * - yellow: 30-60 minutes
 * - orange: 15-30 minutes
 * - red: < 15 minutes or time's up
 */
export function getTimeBadgeColor(minutes: number | null): 'green' | 'yellow' | 'orange' | 'red' | null {
  if (minutes === null) return null;

  if (minutes <= 0) return 'red';
  if (minutes < 15) return 'red';
  if (minutes < 30) return 'orange';
  if (minutes < 60) return 'yellow';
  return 'green';
}

/**
 * Check if time limit has been reached
 */
export function isTimeLimitReached(minutes: number | null): boolean {
  return minutes !== null && minutes <= 0;
}

/**
 * Get percentage of time used (0-100)
 * Returns null if no limit is set
 */
export function getTimeUsedPercentage(
  usedMinutes: number,
  timeLimits: TimeLimits | null
): number | null {
  const todayLimit = getTodayTimeLimit(timeLimits);
  if (todayLimit === null) return null;

  const percentage = (usedMinutes / todayLimit) * 100;
  return Math.min(Math.round(percentage), 100);
}
