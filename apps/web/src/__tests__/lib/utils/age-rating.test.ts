/**
 * Unit tests for age rating utilities
 */

import {
  ageRatingToNumber,
  numberToAgeRating,
  canChildViewVideo,
  getAgeRatingLabel,
} from '@/lib/utils/age-rating';

describe('Age Rating Utilities', () => {
  describe('ageRatingToNumber', () => {
    it('should convert AGE_2_PLUS to 2', () => {
      expect(ageRatingToNumber('AGE_2_PLUS')).toBe(2);
    });

    it('should convert AGE_4_PLUS to 4', () => {
      expect(ageRatingToNumber('AGE_4_PLUS')).toBe(4);
    });

    it('should convert AGE_7_PLUS to 7', () => {
      expect(ageRatingToNumber('AGE_7_PLUS')).toBe(7);
    });

    it('should convert AGE_10_PLUS to 10', () => {
      expect(ageRatingToNumber('AGE_10_PLUS')).toBe(10);
    });

    it('should return 0 for invalid rating', () => {
      expect(ageRatingToNumber('INVALID' as any)).toBe(0);
    });
  });

  describe('numberToAgeRating', () => {
    it('should convert 2 to AGE_2_PLUS', () => {
      expect(numberToAgeRating(2)).toBe('AGE_2_PLUS');
    });

    it('should convert 3 to AGE_2_PLUS (rounds down)', () => {
      expect(numberToAgeRating(3)).toBe('AGE_2_PLUS');
    });

    it('should convert 5 to AGE_4_PLUS', () => {
      expect(numberToAgeRating(5)).toBe('AGE_4_PLUS');
    });

    it('should convert 8 to AGE_7_PLUS', () => {
      expect(numberToAgeRating(8)).toBe('AGE_7_PLUS');
    });

    it('should convert 12 to AGE_10_PLUS', () => {
      expect(numberToAgeRating(12)).toBe('AGE_10_PLUS');
    });

    it('should handle age 1 as AGE_2_PLUS', () => {
      expect(numberToAgeRating(1)).toBe('AGE_2_PLUS');
    });

    it('should handle age 0 as AGE_2_PLUS', () => {
      expect(numberToAgeRating(0)).toBe('AGE_2_PLUS');
    });
  });

  describe('canChildViewVideo', () => {
    it('should allow 7-year-old to view AGE_2_PLUS content', () => {
      expect(canChildViewVideo(7, 'AGE_2_PLUS')).toBe(true);
    });

    it('should allow 7-year-old to view AGE_4_PLUS content', () => {
      expect(canChildViewVideo(7, 'AGE_4_PLUS')).toBe(true);
    });

    it('should allow 7-year-old to view AGE_7_PLUS content', () => {
      expect(canChildViewVideo(7, 'AGE_7_PLUS')).toBe(true);
    });

    it('should not allow 7-year-old to view AGE_10_PLUS content', () => {
      expect(canChildViewVideo(7, 'AGE_10_PLUS')).toBe(false);
    });

    it('should allow 10-year-old to view all content', () => {
      expect(canChildViewVideo(10, 'AGE_2_PLUS')).toBe(true);
      expect(canChildViewVideo(10, 'AGE_4_PLUS')).toBe(true);
      expect(canChildViewVideo(10, 'AGE_7_PLUS')).toBe(true);
      expect(canChildViewVideo(10, 'AGE_10_PLUS')).toBe(true);
    });

    it('should not allow 3-year-old to view AGE_4_PLUS content', () => {
      expect(canChildViewVideo(3, 'AGE_4_PLUS')).toBe(false);
    });

    it('should handle edge case of exact age match', () => {
      expect(canChildViewVideo(4, 'AGE_4_PLUS')).toBe(true);
    });
  });

  describe('getAgeRatingLabel', () => {
    it('should return label for AGE_2_PLUS', () => {
      expect(getAgeRatingLabel('AGE_2_PLUS')).toBe('Ages 2+');
    });

    it('should return label for AGE_4_PLUS', () => {
      expect(getAgeRatingLabel('AGE_4_PLUS')).toBe('Ages 4+');
    });

    it('should return label for AGE_7_PLUS', () => {
      expect(getAgeRatingLabel('AGE_7_PLUS')).toBe('Ages 7+');
    });

    it('should return label for AGE_10_PLUS', () => {
      expect(getAgeRatingLabel('AGE_10_PLUS')).toBe('Ages 10+');
    });

    it('should return the rating itself if unknown', () => {
      expect(getAgeRatingLabel('UNKNOWN' as any)).toBe('UNKNOWN');
    });
  });
});
