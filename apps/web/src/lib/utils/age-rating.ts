/**
 * Age Rating Utilities
 * Helper functions for working with age ratings
 */

export type AgeRating = 'AGE_2_PLUS' | 'AGE_4_PLUS' | 'AGE_7_PLUS' | 'AGE_10_PLUS';

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

  return map[rating] || 2;
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
