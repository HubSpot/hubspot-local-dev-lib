import { mergeDeep, isObject } from '../objectUtils';

describe('utils/objectUtils', () => {
  describe('isObject()', () => {
    it('should return false for non objects', () => {
      // @ts-expect-error testing invalid input
      expect(isObject('foo')).toBeFalsy();
      // @ts-expect-error testing invalid input
      expect(isObject('foo')).toBeFalsy();
      // @ts-expect-error testing invalid input
      expect(isObject('foo')).toBeFalsy();
    });

    it('should return true for objects', () => {
      expect(isObject({})).toBeTruthy();
      expect(isObject({ some: 'object' })).toBeTruthy();
    });
  });

  describe('mergeDeep()', () => {
    it('should merge simple objects', () => {
      const object1 = { a: 'a' };
      const object2 = { b: 'b' };
      const object3 = { c: 'c' };

      const result = mergeDeep(object1, object2, object3);

      expect(result).toMatchObject({ a: 'a', b: 'b', c: 'c' });
    });

    it('should deeply merge nested objects', () => {
      const object1 = { a: { a: 'a' } };
      const object2 = { a: { b: 'b' } };
      const object3 = { a: { c: 'c' } };

      const result = mergeDeep(object1, object2, object3);

      expect(result).toMatchObject({ a: { a: 'a', b: 'b', c: 'c' } });
    });
  });
});
