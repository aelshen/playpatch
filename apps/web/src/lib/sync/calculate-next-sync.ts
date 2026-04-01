import type { SyncFrequency } from '@prisma/client';

export function calculateNextSync(frequency: SyncFrequency): Date {
  const now = new Date();
  switch (frequency) {
    case 'HOURLY':
      now.setHours(now.getHours() + 1);
      break;
    case 'DAILY':
      now.setDate(now.getDate() + 1);
      break;
    case 'WEEKLY':
      now.setDate(now.getDate() + 7);
      break;
    case 'MANUAL':
      now.setFullYear(now.getFullYear() + 10);
      break;
  }
  return now;
}
