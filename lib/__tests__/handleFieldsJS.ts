import { FieldsJs, isConvertableFieldJs } from '../cms/FieldsJs';
import fs from 'fs-extra';
import child_process from 'child_process';

jest.mock('../fs');
jest.mock('child_process');

describe('lib/cms/handleFieldsJs', () => {
  describe('FieldsJs()', () => {
    beforeEach(() => {
      (child_process.fork as jest.Mock).mockImplementation(() => {
        return {
          pid: 123,
          on: () => {
            return {};
          },
        };
      });
      jest.resetModules();
    });

    const projectRoot = 'folder';
    const filePath = 'folder/sample.module/fields.js';
    const defaultFieldsJs = new FieldsJs(projectRoot, filePath);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    test('getWriteDir() returns the correct path', () => {
      const fieldsJs = new FieldsJs('folder', 'folder/sample.module/fields.js');
      const returned = fieldsJs.getWritePath('temp-dir');
      expect(returned).toBe('temp-dir/sample.module/fields.js');
    });

    test('convert returns a Promise', () => {
      const returned = defaultFieldsJs.convert();
      expect(returned).toBeInstanceOf(Promise);
    });
  });

  describe('isConvertableFieldJs()', () => {
    const src = 'folder';

    it('returns true for root fields.js files', () => {
      const filePath = 'folder/fields.js';
      const returned = isConvertableFieldJs(src, filePath, true);
      expect(returned).toBe(true);
    });

    it('returns true for module fields.js files', () => {
      const filePath = 'folder/sample.module/fields.js';
      const returned = isConvertableFieldJs(src, filePath, true);
      expect(returned).toBe(true);
    });

    it('is false for fields.js files outside of root or module', () => {
      const filePath = 'folder/js/fields.js';
      const returned = isConvertableFieldJs(src, filePath, true);
      expect(returned).toBe(false);
    });

    it('returns false for any other file name', () => {
      expect(isConvertableFieldJs(src, 'folder/fields.json')).toBe(false);
      expect(
        isConvertableFieldJs(src, 'folder/sample.module/fields.json', true)
      ).toBe(false);
      expect(isConvertableFieldJs(src, 'folder/js/example.js', true)).toBe(
        false
      );
    });
  });
});
