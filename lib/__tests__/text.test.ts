import { commaSeparatedValues, toKebabCase } from '../text';

describe('lib/text', () => {
  describe('commaSeparatedValues()', () => {
    it('returns a string with comma separated values', () => {
      const res = commaSeparatedValues(['first', 'second', 'third']);

      expect(res).toBe('first, second, and third');
    });

    it('supports a custom conjuction', async () => {
      const res = commaSeparatedValues(['first', 'second', 'third'], 'custom');

      expect(res).toBe('first, second, custom third');
    });

    it('supports a custom if empty case', async () => {
      const res = commaSeparatedValues([], null, 'input is empty');

      expect(res).toBe('input is empty');
    });

    it('handles a single item array', () => {
      const res = commaSeparatedValues(['only']);

      expect(res).toBe('only');
    });

    it('handles a two item array', () => {
      const res = commaSeparatedValues(['first', 'second']);

      expect(res).toBe('first and second');
    });
  });

  describe('toKebabCase()', () => {
    it('converts a string to kebab case', () => {
      expect(toKebabCase('testString')).toBe('test-string');
    });

    it('handles capitalized words', () => {
      expect(toKebabCase('TestString')).toBe('test-string');
    });

    it('handles spaces', () => {
      expect(toKebabCase('test string')).toBe('test-string');
    });

    it('handles special characters', () => {
      expect(toKebabCase('test!@#$%^&*()string')).toBe('test-string');
    });

    it('handles multiple uppercase letters in sequence', () => {
      expect(toKebabCase('testAPIString')).toBe('test-api-string');
    });

    it('handles empty string', () => {
      expect(toKebabCase('')).toBe('');
    });

    it('handles null or undefined input by returning empty string', () => {
      // @ts-expect-error - Testing null input even though type is string
      expect(toKebabCase(null)).toBe('');
      // @ts-expect-error - Testing undefined input even though type is string
      expect(toKebabCase(undefined)).toBe('');
    });
  });
});
