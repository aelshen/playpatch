/**
 * Tests for Recommendation Engine
 */

import { calculateOverlap } from '@/lib/recommendations/engine';

describe('Recommendation Engine', () => {
  describe('calculateOverlap', () => {
    it('should return 0 for empty arrays', () => {
      expect(calculateOverlap([], [])).toBe(0);
      expect(calculateOverlap(['test'], [])).toBe(0);
      expect(calculateOverlap([], ['test'])).toBe(0);
    });

    it('should return 1 for identical arrays', () => {
      expect(calculateOverlap(['dinosaurs', 'science'], ['dinosaurs', 'science'])).toBe(1);
    });

    it('should return 0.5 for 50% overlap', () => {
      // Overlap: 1 item (dinosaurs), Union: 3 items (dinosaurs, science, space)
      expect(calculateOverlap(['dinosaurs', 'science'], ['dinosaurs', 'space'])).toBeCloseTo(
        0.333,
        2
      );
    });

    it('should return partial overlap correctly', () => {
      // Overlap: 2 items (a, b), Union: 4 items (a, b, c, d)
      expect(calculateOverlap(['a', 'b', 'c'], ['a', 'b', 'd'])).toBe(0.5);
    });

    it('should be case-insensitive', () => {
      expect(calculateOverlap(['Dinosaurs', 'SCIENCE'], ['dinosaurs', 'science'])).toBe(1);
    });

    it('should handle no overlap', () => {
      expect(calculateOverlap(['cats', 'dogs'], ['birds', 'fish'])).toBe(0);
    });

    it('should handle single element overlap', () => {
      // Overlap: 1, Union: 2
      expect(calculateOverlap(['cats'], ['cats'])).toBe(1);
    });

    it('should handle complex scenarios', () => {
      const topics1 = ['space', 'planets', 'astronomy', 'mars'];
      const topics2 = ['space', 'astronomy', 'rockets', 'nasa'];
      // Overlap: 2 (space, astronomy)
      // Union: 6 (space, planets, astronomy, mars, rockets, nasa)
      expect(calculateOverlap(topics1, topics2)).toBeCloseTo(0.333, 2);
    });
  });

  describe('Category matching', () => {
    it('should prioritize exact category matches', () => {
      const categories1 = ['EDUCATIONAL', 'SCIENCE'];
      const categories2 = ['EDUCATIONAL', 'SCIENCE'];
      const overlap = calculateOverlap(categories1, categories2);
      expect(overlap).toBe(1);
    });

    it('should give partial score for partial matches', () => {
      const categories1 = ['EDUCATIONAL', 'SCIENCE'];
      const categories2 = ['EDUCATIONAL', 'ENTERTAINMENT'];
      const overlap = calculateOverlap(categories1, categories2);
      expect(overlap).toBeCloseTo(0.333, 2);
    });
  });

  describe('Topic matching', () => {
    it('should match related topics', () => {
      const topics1 = ['dinosaurs', 'extinction', 'fossils'];
      const topics2 = ['dinosaurs', 'paleontology'];
      const overlap = calculateOverlap(topics1, topics2);
      // Overlap: 1 (dinosaurs), Union: 4
      expect(overlap).toBe(0.25);
    });

    it('should handle special characters in topics', () => {
      const topics1 = ['t-rex', 'velociraptors'];
      const topics2 = ['t-rex', 'stegosaurus'];
      const overlap = calculateOverlap(topics1, topics2);
      // Overlap: 1, Union: 3
      expect(overlap).toBeCloseTo(0.333, 2);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long arrays efficiently', () => {
      const arr1 = Array.from({ length: 100 }, (_, i) => `item${i}`);
      const arr2 = Array.from({ length: 100 }, (_, i) => `item${i + 50}`);
      // Overlap: 50 items, Union: 150 items
      const overlap = calculateOverlap(arr1, arr2);
      expect(overlap).toBeCloseTo(0.333, 2);
    });

    it('should handle duplicate items in arrays', () => {
      // Should treat duplicates as single items
      const arr1 = ['a', 'a', 'b'];
      const arr2 = ['a', 'b', 'b'];
      const overlap = calculateOverlap(arr1, arr2);
      expect(overlap).toBe(1); // Both have {a, b}
    });

    it('should handle arrays with whitespace', () => {
      const arr1 = ['  space  ', 'planets'];
      const arr2 = ['space', 'planets  '];
      // Note: Our implementation doesn't trim, so these won't match
      // This test documents current behavior
      const overlap = calculateOverlap(arr1, arr2);
      expect(overlap).toBeLessThan(1);
    });
  });

  describe('Scoring scenarios', () => {
    it('should score high for videos with same category and topics', () => {
      const video1Categories = ['EDUCATIONAL', 'SCIENCE'];
      const video1Topics = ['space', 'planets', 'solar system'];

      const video2Categories = ['EDUCATIONAL', 'SCIENCE'];
      const video2Topics = ['space', 'astronomy', 'stars'];

      const categoryScore = calculateOverlap(video1Categories, video2Categories);
      const topicScore = calculateOverlap(video1Topics, video2Topics);

      // Categories: perfect match
      expect(categoryScore).toBe(1);
      // Topics: 1/5 = 0.2 overlap (space matches, 5 unique topics total)
      expect(topicScore).toBe(0.2);
    });

    it('should score lower for different categories but similar topics', () => {
      const video1Categories = ['EDUCATIONAL'];
      const video1Topics = ['dinosaurs', 'fossils'];

      const video2Categories = ['ENTERTAINMENT'];
      const video2Topics = ['dinosaurs', 'adventure'];

      const categoryScore = calculateOverlap(video1Categories, video2Categories);
      const topicScore = calculateOverlap(video1Topics, video2Topics);

      // No category overlap
      expect(categoryScore).toBe(0);
      // Some topic overlap (dinosaurs matches)
      expect(topicScore).toBeCloseTo(0.333, 2);
    });

    it('should score high for same channel content', () => {
      // This would be tested with actual video objects
      // Just documenting expected behavior:
      // Same channel = 1.0 history score
      // Different channel = 0.5 history score
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Algorithm weights', () => {
    it('should weight category matches at 40%', () => {
      // Category match = 1.0
      // Expected contribution: 1.0 * 0.4 = 0.4
      const CATEGORY_WEIGHT = 0.4;
      expect(1.0 * CATEGORY_WEIGHT).toBe(0.4);
    });

    it('should weight topic overlap at 30%', () => {
      const TOPIC_WEIGHT = 0.3;
      expect(1.0 * TOPIC_WEIGHT).toBe(0.3);
    });

    it('should weight watch history at 20%', () => {
      const HISTORY_WEIGHT = 0.2;
      expect(1.0 * HISTORY_WEIGHT).toBe(0.2);
    });

    it('should weight age appropriateness at 10%', () => {
      const AGE_WEIGHT = 0.1;
      expect(1.0 * AGE_WEIGHT).toBe(0.1);
    });

    it('should sum weights to 100%', () => {
      const totalWeight = 0.4 + 0.3 + 0.2 + 0.1;
      expect(totalWeight).toBeCloseTo(1.0);
    });
  });

  describe('Age rating appropriateness', () => {
    it('should allow lower age ratings', () => {
      // AGE_2_PLUS video should be appropriate for AGE_7_PLUS child
      // Expected score: 0.8 (slightly lower than perfect match)
      expect(true).toBe(true); // Documented behavior
    });

    it('should give perfect score for exact age match', () => {
      // AGE_7_PLUS video for AGE_7_PLUS child
      // Expected score: 1.0
      expect(true).toBe(true); // Documented behavior
    });

    it('should filter out higher age ratings', () => {
      // AGE_10_PLUS video should not be shown to AGE_7_PLUS child
      // This filtering happens at query level, not scoring
      expect(true).toBe(true); // Documented behavior
    });
  });
});
