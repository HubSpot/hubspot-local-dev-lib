import path from 'path';

import { validateSrcAndDestPaths, ValidationIds } from '../cms/modules';

import { PathInput } from '../../types/Modules';
import { ValueOf } from '../../types/Utils';

const isLocal = true;
const isHubSpot = true;

// TODO: Replace two missing tests

describe('lib/cms/modules', () => {
  describe('validateSrcAndDestPaths()', () => {
    const emptyLocal = { isLocal, path: '' };
    const emptyHubSpot = { isHubSpot, path: '' };
    const simpleTestCases: Array<{
      ids: Array<ValueOf<typeof ValidationIds>>;
      args: Array<PathInput | undefined>;
    }> = [
      {
        args: [],
        ids: [ValidationIds.SRC_REQUIRED, ValidationIds.DEST_REQUIRED],
      },
      {
        args: [emptyLocal],
        ids: [ValidationIds.DEST_REQUIRED],
      },
      {
        args: [undefined, emptyHubSpot],
        ids: [ValidationIds.SRC_REQUIRED],
      },
      {
        // @ts-expect-error testing invalid input
        args: [emptyLocal, { isHubSpot }],
        ids: [ValidationIds.DEST_REQUIRED],
      },
      {
        // @ts-expect-error testing invalid input
        args: [{ isLocal }, emptyHubSpot],
        ids: [ValidationIds.SRC_REQUIRED],
      },
      {
        args: [emptyLocal, emptyHubSpot],
        ids: [],
      },
      {
        args: [
          { isLocal, path: 'x' },
          { isHubSpot, path: 'x' },
        ],
        ids: [],
      },
    ];
    it('should be an async function', () => {
      expect(validateSrcAndDestPaths() instanceof Promise).toBe(true);
    });
    it('should return an array', () => {
      simpleTestCases.forEach(async ({ args }) => {
        const result = await validateSrcAndDestPaths(...args);
        expect(Array.isArray(result)).toBe(true);
      });
    });
    it('should require `src` and `dest` string params', async () => {
      simpleTestCases.forEach(async ({ args, ids }) => {
        const result = await validateSrcAndDestPaths(...args);
        expect(result.length).toBe(ids.length);
        ids.forEach((id, idx) => {
          expect(result[idx] && result[idx].id).toEqual(id);
        });
      });
    });
    it('should normalize paths', async () => {
      let src = { isLocal, path: 'Car Section.module' };
      let dest = { isHubSpot, path: 'Car Section.module/js/../' };
      let result = await validateSrcAndDestPaths(src, dest);
      expect(result.length).toBe(0);
      src = { isLocal, path: path.join('Car Section.module', 'js', '..') };
      dest = { isHubSpot, path: 'Car Section.module' };
      result = await validateSrcAndDestPaths(src, dest);
      expect(result.length).toBe(0);
      src = { isLocal, path: 'Car Section.module' };
      dest = { isHubSpot, path: 'Car Section.module/js/main.js/../' };
      result = await validateSrcAndDestPaths(src, dest);
      expect(result.length).toBe(1);
      src = {
        isLocal,
        path: path.join('Car Section.module', 'js', 'main.js', '..', path.sep),
      };
      dest = { isHubSpot, path: 'Car Section.module' };
      result = await validateSrcAndDestPaths(src, dest);
      expect(result.length).toBe(0);
    });
    describe('hs upload', () => {
      describe('VALID: `src` is a module folder as is `dest`', () => {
        let src = { isLocal, path: 'Card Section.module' };
        let dest = { isHubSpot, path: 'Card Section.module' };
        it(`upload "${src.path}" "${dest.path}"`, async () => {
          const result = await validateSrcAndDestPaths(src, dest);
          expect(result.length).toBe(0);
        });
        src = {
          isLocal,
          path: path.join('boilerplate', 'modules', 'Card Section.module'),
        };
        dest = { isHubSpot, path: 'remote/Card Section.module/' };
        it(`upload "${src.path}" "${dest.path}"`, async () => {
          const result = await validateSrcAndDestPaths(src, dest);
          expect(result.length).toBe(0);
        });
      });
      describe('INVALID: `src` is a module folder but `dest` is not', () => {
        let src = { isLocal, path: 'Card Section.module' };
        let dest = { isHubSpot, path: 'Card Section' };
        it(`upload "${src.path}" "${dest.path}"`, async () => {
          const result = await validateSrcAndDestPaths(src, dest);
          expect(result.length).toBe(1);
          expect(result[0] && result[0].id).toBe(
            ValidationIds.MODULE_FOLDER_REQUIRED
          );
        });
        src = {
          isLocal,
          path: path.join('boilerplate', 'modules', 'Card Section.module'),
        };
        dest = { isHubSpot, path: 'fields.json' };
        it(`upload "${src.path}" "${dest.path}"`, async () => {
          const result = await validateSrcAndDestPaths(src, dest);
          expect(result.length).toBe(1);
          expect(result[0] && result[0].id).toBe(
            ValidationIds.MODULE_FOLDER_REQUIRED
          );
        });
        src = {
          isLocal,
          path: path.join('boilerplate', 'modules', 'Card Section.module'),
        };
        dest = { isHubSpot, path: 'remote/boilerplate/modules/' };
        it(`upload "${src.path}" "${dest.path}"`, async () => {
          const result = await validateSrcAndDestPaths(src, dest);
          expect(result.length).toBe(1);
          expect(result[0] && result[0].id).toBe(
            ValidationIds.MODULE_FOLDER_REQUIRED
          );
        });
      });
      describe('INVALID: `src` is a .module folder and `dest` is within a module. (Nesting)', () => {
        const src = { isLocal, path: 'Car Section.module' };
        const dest = { isHubSpot, path: 'Car Section.module/js' };
        it(`upload "${src.path}" "${dest.path}"`, async () => {
          const result = await validateSrcAndDestPaths(src, dest);
          expect(result.length).toBe(1);
          expect(result[0] && result[0].id).toBe(
            ValidationIds.MODULE_TO_MODULE_NESTING
          );
        });
      });
    });
  });
});
