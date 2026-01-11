/**
 * Unit tests for video constants
 * Ensures constants are properly defined and typed
 */

import {
  AGE_RATINGS,
  CATEGORIES,
  CATEGORY_LABELS,
  VIDEO_STATUS_COLORS,
  APPROVAL_STATUS_COLORS,
  VIDEO_DEFAULTS,
} from '@/lib/constants/video';

describe('Video Constants', () => {
  describe('AGE_RATINGS', () => {
    it('should have 4 age rating levels', () => {
      expect(AGE_RATINGS).toHaveLength(4);
    });

    it('should have correct structure for each rating', () => {
      AGE_RATINGS.forEach((rating) => {
        expect(rating).toHaveProperty('value');
        expect(rating).toHaveProperty('label');
        expect(rating).toHaveProperty('description');
        expect(rating).toHaveProperty('minAge');
        expect(typeof rating.minAge).toBe('number');
      });
    });

    it('should have age ratings in ascending order', () => {
      const ages = AGE_RATINGS.map((r) => r.minAge);
      expect(ages).toEqual([2, 4, 7, 10]);
    });

    it('should have unique values', () => {
      const values = AGE_RATINGS.map((r) => r.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should include AGE_2_PLUS', () => {
      const rating = AGE_RATINGS.find((r) => r.value === 'AGE_2_PLUS');
      expect(rating).toBeDefined();
      expect(rating?.minAge).toBe(2);
      expect(rating?.label).toBe('Ages 2+');
    });

    it('should include AGE_10_PLUS', () => {
      const rating = AGE_RATINGS.find((r) => r.value === 'AGE_10_PLUS');
      expect(rating).toBeDefined();
      expect(rating?.minAge).toBe(10);
      expect(rating?.label).toBe('Ages 10+');
    });
  });

  describe('CATEGORIES', () => {
    it('should have at least 10 categories', () => {
      expect(CATEGORIES.length).toBeGreaterThanOrEqual(10);
    });

    it('should include common categories', () => {
      expect(CATEGORIES).toContain('EDUCATIONAL');
      expect(CATEGORIES).toContain('ENTERTAINMENT');
      expect(CATEGORIES).toContain('SCIENCE');
      expect(CATEGORIES).toContain('MUSIC');
    });

    it('should have unique categories', () => {
      const uniqueCategories = new Set(CATEGORIES);
      expect(uniqueCategories.size).toBe(CATEGORIES.length);
    });

    it('should have uppercase categories', () => {
      CATEGORIES.forEach((category) => {
        expect(category).toBe(category.toUpperCase());
      });
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('should have labels for all categories', () => {
      CATEGORIES.forEach((category) => {
        expect(CATEGORY_LABELS[category]).toBeDefined();
        expect(typeof CATEGORY_LABELS[category]).toBe('string');
      });
    });

    it('should have formatted labels', () => {
      expect(CATEGORY_LABELS.EDUCATIONAL).toBe('Educational');
      expect(CATEGORY_LABELS.ARTS_CRAFTS).toBe('Arts & Crafts');
      expect(CATEGORY_LABELS.SCIENCE).toBe('Science');
    });
  });

  describe('VIDEO_STATUS_COLORS', () => {
    it('should have colors for all statuses', () => {
      const statuses = ['PENDING', 'DOWNLOADING', 'PROCESSING', 'READY', 'ERROR'];
      statuses.forEach((status) => {
        expect(VIDEO_STATUS_COLORS[status]).toBeDefined();
        expect(typeof VIDEO_STATUS_COLORS[status]).toBe('string');
      });
    });

    it('should use Tailwind CSS classes', () => {
      Object.values(VIDEO_STATUS_COLORS).forEach((color) => {
        expect(color).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/);
      });
    });

    it('should have appropriate colors for statuses', () => {
      expect(VIDEO_STATUS_COLORS.READY).toContain('green');
      expect(VIDEO_STATUS_COLORS.ERROR).toContain('red');
      expect(VIDEO_STATUS_COLORS.PENDING).toContain('yellow');
    });
  });

  describe('APPROVAL_STATUS_COLORS', () => {
    it('should have colors for all approval statuses', () => {
      const statuses = ['PENDING', 'APPROVED', 'REJECTED'];
      statuses.forEach((status) => {
        expect(APPROVAL_STATUS_COLORS[status]).toBeDefined();
      });
    });

    it('should have appropriate colors', () => {
      expect(APPROVAL_STATUS_COLORS.APPROVED).toContain('green');
      expect(APPROVAL_STATUS_COLORS.REJECTED).toContain('red');
      expect(APPROVAL_STATUS_COLORS.PENDING).toContain('yellow');
    });
  });

  describe('VIDEO_DEFAULTS', () => {
    it('should have default age rating', () => {
      expect(VIDEO_DEFAULTS.AGE_RATING).toBe('AGE_7_PLUS');
    });

    it('should have default status', () => {
      expect(VIDEO_DEFAULTS.STATUS).toBe('PENDING');
    });

    it('should have default approval status', () => {
      expect(VIDEO_DEFAULTS.APPROVAL_STATUS).toBe('PENDING');
    });

    it('should have pagination defaults', () => {
      expect(VIDEO_DEFAULTS.LIMIT).toBe(20);
      expect(VIDEO_DEFAULTS.MAX_LIMIT).toBe(100);
    });

    it('should have sensible pagination limits', () => {
      expect(VIDEO_DEFAULTS.LIMIT).toBeGreaterThan(0);
      expect(VIDEO_DEFAULTS.MAX_LIMIT).toBeGreaterThan(VIDEO_DEFAULTS.LIMIT);
      expect(VIDEO_DEFAULTS.MAX_LIMIT).toBeLessThanOrEqual(1000);
    });
  });
});
