import { isDeepEqual } from '../isDeepEqual.js';

describe('isDeepEqual', () => {
  describe('primitive values', () => {
    it('should return true for identical primitives', () => {
      expect(isDeepEqual(1, 1)).toBe(true);
      expect(isDeepEqual('hello', 'hello')).toBe(true);
      expect(isDeepEqual(true, true)).toBe(true);
      expect(isDeepEqual(false, false)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(isDeepEqual(1, 2)).toBe(false);
      expect(isDeepEqual('hello', 'world')).toBe(false);
      expect(isDeepEqual(true, false)).toBe(false);
      expect(isDeepEqual(1, '1')).toBe(false);
    });

    it('should handle zero and negative numbers correctly', () => {
      expect(isDeepEqual(0, 0)).toBe(true);
      expect(isDeepEqual(-1, -1)).toBe(true);
      expect(isDeepEqual(0, -0)).toBe(true);
      expect(isDeepEqual(0, 1)).toBe(false);
      expect(isDeepEqual(-1, 1)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isDeepEqual('', '')).toBe(true);
      expect(isDeepEqual('', 'a')).toBe(false);
    });
  });

  describe('null and undefined', () => {
    it('should return true for null === null and undefined === undefined', () => {
      expect(isDeepEqual(null, null)).toBe(true);
      expect(isDeepEqual(undefined, undefined)).toBe(true);
    });

    it('should return false for null vs undefined', () => {
      expect(isDeepEqual(null, undefined)).toBe(false);
      expect(isDeepEqual(undefined, null)).toBe(false);
    });

    it('should return false for null/undefined vs other values', () => {
      expect(isDeepEqual(null, 0)).toBe(false);
      expect(isDeepEqual(undefined, 0)).toBe(false);
      expect(isDeepEqual(null, '')).toBe(false);
      expect(isDeepEqual(null, false)).toBe(false);
      expect(isDeepEqual(null, {})).toBe(false);
    });
  });

  describe('objects', () => {
    it('should return true for identical empty objects', () => {
      expect(isDeepEqual({}, {})).toBe(true);
    });

    it('should return true for objects with same properties', () => {
      const obj1 = { a: 1, b: 'hello' };
      const obj2 = { a: 1, b: 'hello' };
      expect(isDeepEqual(obj1, obj2)).toBe(true);
    });

    it('should return true for objects with same properties in different order', () => {
      const obj1 = { a: 1, b: 'hello' };
      const obj2 = { b: 'hello', a: 1 };
      expect(isDeepEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for objects with different property values', () => {
      const obj1 = { a: 1, b: 'hello' };
      const obj2 = { a: 1, b: 'world' };
      expect(isDeepEqual(obj1, obj2)).toBe(false);
    });

    it('should return false for objects with different number of properties', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1, b: 2 };
      expect(isDeepEqual(obj1, obj2)).toBe(false);
    });

    it('should return false for objects with different property keys', () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 1 };
      expect(isDeepEqual(obj1, obj2)).toBe(false);
    });

    it('should return true for same object reference', () => {
      const obj = { a: 1, b: 'hello' };
      expect(isDeepEqual(obj, obj)).toBe(true);
    });
  });

  describe('nested objects', () => {
    it('should return true for deeply nested identical objects', () => {
      const obj1 = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 'nested',
            f: true,
          },
        },
      };
      const obj2 = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 'nested',
            f: true,
          },
        },
      };
      expect(isDeepEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for deeply nested objects with differences', () => {
      const obj1 = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 'nested',
            f: true,
          },
        },
      };
      const obj2 = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 'nested',
            f: false, // Different value
          },
        },
      };
      expect(isDeepEqual(obj1, obj2)).toBe(false);
    });

    it('should handle objects with nested null/undefined values', () => {
      const obj1 = { a: null, b: { c: undefined } };
      const obj2 = { a: null, b: { c: undefined } };
      expect(isDeepEqual(obj1, obj2)).toBe(true);

      const obj3 = { a: null, b: { c: null } };
      expect(isDeepEqual(obj1, obj3)).toBe(false);
    });
  });

  describe('arrays', () => {
    it('should return true for identical empty arrays', () => {
      expect(isDeepEqual([], [])).toBe(true);
    });

    it('should return true for arrays with same elements', () => {
      expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isDeepEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    });

    it('should return false for arrays with different elements', () => {
      expect(isDeepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(isDeepEqual(['a', 'b'], ['a', 'c'])).toBe(false);
    });

    it('should return false for arrays with different lengths', () => {
      expect(isDeepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(isDeepEqual([1, 2, 3], [1, 2])).toBe(false);
    });

    it('should return false for arrays with same elements in different order', () => {
      expect(isDeepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
      expect(isDeepEqual(['a', 'b'], ['b', 'a'])).toBe(false);
    });

    it('should handle nested arrays', () => {
      const arr1 = [1, [2, 3], [4, [5, 6]]];
      const arr2 = [1, [2, 3], [4, [5, 6]]];
      expect(isDeepEqual(arr1, arr2)).toBe(true);

      const arr3 = [1, [2, 3], [4, [5, 7]]];
      expect(isDeepEqual(arr1, arr3)).toBe(false);
    });

    it('should handle arrays with objects', () => {
      const arr1 = [{ a: 1 }, { b: 2 }];
      const arr2 = [{ a: 1 }, { b: 2 }];
      expect(isDeepEqual(arr1, arr2)).toBe(true);

      const arr3 = [{ a: 1 }, { b: 3 }];
      expect(isDeepEqual(arr1, arr3)).toBe(false);
    });
  });

  describe('mixed types', () => {
    it('should return false for object vs array', () => {
      expect(isDeepEqual({}, [])).toBe(false);
      expect(isDeepEqual({ 0: 'a', 1: 'b' }, ['a', 'b'])).toBe(false);
    });

    it('should return false for object vs primitive', () => {
      expect(isDeepEqual({}, null)).toBe(false);
      expect(isDeepEqual({ a: 1 }, 1)).toBe(false);
      expect(isDeepEqual({}, '')).toBe(false);
    });

    it('should return false for array vs primitive', () => {
      expect(isDeepEqual([], null)).toBe(false);
      expect(isDeepEqual([1], 1)).toBe(false);
      expect(isDeepEqual([], '')).toBe(false);
    });

    it('should handle complex mixed structures', () => {
      const obj1 = {
        number: 42,
        string: 'hello',
        boolean: true,
        null_value: null,
        array: [1, 'two', { three: 3 }],
        nested: {
          deep: {
            value: 'found',
          },
        },
      };

      const obj2 = {
        number: 42,
        string: 'hello',
        boolean: true,
        null_value: null,
        array: [1, 'two', { three: 3 }],
        nested: {
          deep: {
            value: 'found',
          },
        },
      };

      expect(isDeepEqual(obj1, obj2)).toBe(true);

      const obj3 = { ...obj2, number: 43 };
      expect(isDeepEqual(obj1, obj3)).toBe(false);
    });
  });

  describe('ignoreKeys functionality', () => {
    it('should ignore specified keys in comparison', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 999, c: 3 }; // b is different

      expect(isDeepEqual(obj1, obj2)).toBe(false);
      expect(isDeepEqual(obj1, obj2, ['b'])).toBe(true);
    });

    it('should ignore multiple keys', () => {
      const obj1 = { a: 1, b: 2, c: 3, d: 4 };
      const obj2 = { a: 1, b: 999, c: 888, d: 4 }; // b and c are different

      expect(isDeepEqual(obj1, obj2, ['b', 'c'])).toBe(true);
    });

    it('should ignore keys in nested objects', () => {
      const obj1 = {
        top: 'same',
        nested: {
          keep: 'this',
          ignore: 'different1',
          deep: {
            keep: 'this',
            ignore: 'different2',
          },
        },
      };

      const obj2 = {
        top: 'same',
        nested: {
          keep: 'this',
          ignore: 'DIFFERENT1',
          deep: {
            keep: 'this',
            ignore: 'DIFFERENT2',
          },
        },
      };

      expect(isDeepEqual(obj1, obj2)).toBe(false);
      expect(isDeepEqual(obj1, obj2, ['ignore'])).toBe(true);
    });

    it('should handle ignoreKeys when one object has extra properties', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2, c: 3 };

      expect(isDeepEqual(obj1, obj2, ['c'])).toBe(true);
      expect(isDeepEqual(obj2, obj1, ['c'])).toBe(true);
    });

    it('should ignore keys in arrays (array indices as keys)', () => {
      const arr1 = ['keep', 'ignore', 'keep'];
      const arr2 = ['keep', 'DIFFERENT', 'keep'];

      expect(isDeepEqual(arr1, arr2, ['1'])).toBe(true);
    });

    it('should not affect primitive comparisons', () => {
      expect(isDeepEqual(1, 2, ['any', 'keys'])).toBe(false);
      expect(isDeepEqual('hello', 'hello', ['any', 'keys'])).toBe(true);
    });
  });
});
