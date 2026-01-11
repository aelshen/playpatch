/**
 * Unit tests for shared utility functions
 */

import { formatDuration, calculateAge, truncateText } from '@/lib/utils/shared';

describe('Shared Utility Functions', () => {
  describe('formatDuration', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatDuration(65)).toBe('1:05');
    });

    it('should format minutes to MM:SS', () => {
      expect(formatDuration(300)).toBe('5:00');
    });

    it('should format hours to H:MM:SS', () => {
      expect(formatDuration(3665)).toBe('1:01:05');
    });

    it('should handle 0 seconds', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('should handle single digit seconds', () => {
      expect(formatDuration(5)).toBe('0:05');
    });

    it('should handle single digit minutes', () => {
      expect(formatDuration(125)).toBe('2:05');
    });

    it('should handle double digit hours', () => {
      expect(formatDuration(36000)).toBe('10:00:00');
    });

    it('should pad seconds with zero', () => {
      expect(formatDuration(61)).toBe('1:01');
      expect(formatDuration(3601)).toBe('1:00:01');
    });
  });

  describe('calculateAge', () => {
    it('should calculate age from birthdate', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 7);
      expect(calculateAge(birthDate)).toBe(7);
    });

    it('should handle birthday not yet passed this year', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 7);
      birthDate.setMonth(birthDate.getMonth() + 1); // Birthday next month
      expect(calculateAge(birthDate)).toBe(6);
    });

    it('should handle birthday today', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 7);
      expect(calculateAge(birthDate)).toBe(7);
    });

    it('should handle newborn (0 years)', () => {
      const birthDate = new Date();
      expect(calculateAge(birthDate)).toBe(0);
    });

    it('should handle dates far in the past', () => {
      const birthDate = new Date('1990-01-01');
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThan(30);
      expect(age).toBeLessThan(40);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(truncateText(text, 20)).toBe('This is a very long...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });

    it('should handle text exactly at limit', () => {
      const text = 'Exactly twenty chars';
      expect(truncateText(text, 20)).toBe('Exactly twenty chars');
    });

    it('should use custom suffix', () => {
      const text = 'This is a very long text';
      expect(truncateText(text, 10, '…')).toBe('This is a…');
    });

    it('should handle empty text', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('should handle very short limit', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });
  });
});
