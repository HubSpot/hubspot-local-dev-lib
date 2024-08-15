import { commaSeparatedValues } from '../text';

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
  });
});
