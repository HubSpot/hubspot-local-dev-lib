import { vi } from 'vitest';
import { getDateBasedVersionSegment } from '../dateBasedVersion.js';

describe('utils/dateBasedVersion', () => {
  const version = '2027-03';
  const stableStartDate = new Date('2027-03-01T00:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDateBasedVersionSegment', () => {
    it('returns the beta segment before the stable start date', () => {
      vi.setSystemTime(new Date('2027-02-28T23:59:59.999Z'));
      expect(getDateBasedVersionSegment(version, stableStartDate)).toBe(
        '2027-03-beta'
      );
    });

    it('returns the stable segment exactly at the stable start date', () => {
      vi.setSystemTime(stableStartDate);
      expect(getDateBasedVersionSegment(version, stableStartDate)).toBe(
        '2027-03'
      );
    });

    it('returns the stable segment after the stable start date', () => {
      vi.setSystemTime(new Date('2027-03-01T00:00:00.001Z'));
      expect(getDateBasedVersionSegment(version, stableStartDate)).toBe(
        '2027-03'
      );
    });

    it('re-evaluates the current time on every call', () => {
      vi.setSystemTime(new Date('2027-02-01T00:00:00Z'));
      expect(getDateBasedVersionSegment(version, stableStartDate)).toBe(
        '2027-03-beta'
      );
      vi.setSystemTime(new Date('2027-04-01T00:00:00Z'));
      expect(getDateBasedVersionSegment(version, stableStartDate)).toBe(
        '2027-03'
      );
    });
  });
});
