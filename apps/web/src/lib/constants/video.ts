/**
 * Video-related Constants
 * Centralized constants for video management
 */

/**
 * Age rating options with metadata
 */
export const AGE_RATINGS = [
  {
    value: 'AGE_2_PLUS',
    label: 'Ages 2+',
    description: 'Toddlers and preschoolers',
    minAge: 2,
  },
  {
    value: 'AGE_4_PLUS',
    label: 'Ages 4+',
    description: 'Preschool and early elementary',
    minAge: 4,
  },
  {
    value: 'AGE_7_PLUS',
    label: 'Ages 7+',
    description: 'Elementary school',
    minAge: 7,
  },
  {
    value: 'AGE_10_PLUS',
    label: 'Ages 10+',
    description: 'Pre-teen and older',
    minAge: 10,
  },
] as const;

/**
 * Video categories
 */
export const CATEGORIES = [
  'EDUCATIONAL',
  'ENTERTAINMENT',
  'MUSIC',
  'ANIMATION',
  'STORIES',
  'ARTS_CRAFTS',
  'NATURE',
  'SCIENCE',
  'MATH',
  'LANGUAGE',
] as const;

/**
 * Category labels (formatted for display)
 */
export const CATEGORY_LABELS: Record<string, string> = {
  EDUCATIONAL: 'Educational',
  ENTERTAINMENT: 'Entertainment',
  MUSIC: 'Music',
  ANIMATION: 'Animation',
  STORIES: 'Stories',
  ARTS_CRAFTS: 'Arts & Crafts',
  NATURE: 'Nature',
  SCIENCE: 'Science',
  MATH: 'Math',
  LANGUAGE: 'Language',
};

/**
 * Video status colors for badges
 */
export const VIDEO_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  DOWNLOADING: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  READY: 'bg-green-100 text-green-800',
  ERROR: 'bg-red-100 text-red-800',
};

/**
 * Approval status colors for badges
 */
export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

/**
 * Video status labels (formatted for display)
 */
export const VIDEO_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  DOWNLOADING: 'Downloading',
  PROCESSING: 'Processing',
  READY: 'Ready',
  ERROR: 'Error',
};

/**
 * Approval status labels (formatted for display)
 */
export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

/**
 * Video source types
 */
export const SOURCE_TYPES = {
  YOUTUBE: 'YouTube',
  DIRECT_UPLOAD: 'Direct Upload',
  OTHER: 'Other',
} as const;

/**
 * Default values
 */
export const VIDEO_DEFAULTS = {
  AGE_RATING: 'AGE_7_PLUS',
  STATUS: 'PENDING',
  APPROVAL_STATUS: 'PENDING',
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
