/**
 * Shared constants
 */

export const AGE_RATINGS = ['2+', '4+', '7+', '10+'] as const;

export const VIDEO_CATEGORIES = [
  'Educational',
  'Math',
  'Science',
  'Reading',
  'Entertainment',
  'Music & Dance',
  'Stories & Books',
  'Arts & Crafts',
  'Animals & Nature',
  'Sports & Movement',
] as const;

export const UI_MODES = {
  TODDLER: 'TODDLER',
  EXPLORER: 'EXPLORER',
} as const;

export const VIDEO_STATUS = {
  PENDING: 'PENDING',
  DOWNLOADING: 'DOWNLOADING',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  ERROR: 'ERROR',
} as const;
