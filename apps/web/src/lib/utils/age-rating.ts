/**
 * Age Rating Utilities
 * Helper functions for working with age ratings
 */

export type AgeRating = 'AGE_2_PLUS' | 'AGE_4_PLUS' | 'AGE_7_PLUS' | 'AGE_10_PLUS';

/**
 * Maps age rating enum values to approximate child ages used for AI context.
 * These are midpoint/representative ages rather than minimum ages.
 */
export const AGE_RATING_TO_NUMBER: Record<string, number> = {
  AGE_2_PLUS: 3,
  AGE_4_PLUS: 5,
  AGE_7_PLUS: 8,
  AGE_10_PLUS: 11,
};

/**
 * Map age rating enum to numeric value
 */
export function ageRatingToNumber(rating: AgeRating | string): number {
  const map: Record<string, number> = {
    AGE_2_PLUS: 2,
    AGE_4_PLUS: 4,
    AGE_7_PLUS: 7,
    AGE_10_PLUS: 10,
  };

  return map[rating] || 0;
}

/**
 * Map numeric value to age rating enum
 */
export function numberToAgeRating(age: number): AgeRating {
  if (age >= 10) return 'AGE_10_PLUS';
  if (age >= 7) return 'AGE_7_PLUS';
  if (age >= 4) return 'AGE_4_PLUS';
  return 'AGE_2_PLUS';
}

/**
 * Check if a child of given age can view content with given age rating
 */
export function canChildViewVideo(childAge: number, contentRating: AgeRating | string): boolean {
  const contentMinAge = ageRatingToNumber(contentRating);
  return childAge >= contentMinAge;
}

/**
 * Get human-readable label for age rating
 */
export function getAgeRatingLabel(rating: AgeRating | string): string {
  const labels: Record<string, string> = {
    AGE_2_PLUS: 'Ages 2+',
    AGE_4_PLUS: 'Ages 4+',
    AGE_7_PLUS: 'Ages 7+',
    AGE_10_PLUS: 'Ages 10+',
  };

  return labels[rating] || rating;
}

/**
 * Get all age ratings that are appropriate for a given max age
 */
export function getAllowedAgeRatings(maxAgeRating: AgeRating | string): AgeRating[] {
  const maxAge = ageRatingToNumber(maxAgeRating);
  const allRatings: Array<{ rating: AgeRating; age: number }> = [
    { rating: 'AGE_2_PLUS', age: 2 },
    { rating: 'AGE_4_PLUS', age: 4 },
    { rating: 'AGE_7_PLUS', age: 7 },
    { rating: 'AGE_10_PLUS', age: 10 },
  ];

  return allRatings
    .filter(r => r.age <= maxAge)
    .map(r => r.rating);
}
