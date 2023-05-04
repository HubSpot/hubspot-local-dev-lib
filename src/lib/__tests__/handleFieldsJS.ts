import { FieldsJs, isConvertableFieldJs } from '../cms/handleFieldsJS';
import fs from 'fs-extra';
import child_process from 'child_process';

jest.mock('../fs');
jest.mock('child_process');

describe('handleFieldsJs', () => {
  describe('FieldsJs', () => {
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

    test('getOutputPathPromise() resolves to the correct path', async () => {
      const fieldsJs = new FieldsJs(
        'folder',
        'folder/sample.module/fields.js',
        'temp-dir'
      );
      const convertSpy = jest
        .spyOn(FieldsJs.prototype, 'convertFieldsJs')
        .mockResolvedValue('temp-dir/sample.module/fields.js');

      const returned = fieldsJs.getOutputPathPromise();
      await expect(returned).resolves.toBe('temp-dir/sample.module/fields.js');
      convertSpy.mockRestore();
    });

    test('getWriteDir() returns the correct path', () => {
      const fieldsJs = new FieldsJs(
        'folder',
        'folder/sample.module/fields.js',
        'temp-dir'
      );
      const returned = fieldsJs.getWriteDir();
      expect(returned).toBe('temp-dir/sample.module');
    });

    test('saveOutput() sets the save path correctly', () => {
      const copyFileSpy = jest
        .spyOn(fs, 'copyFileSync')
        .mockImplementation(() => null);
      const fieldsJs = new FieldsJs(
        'folder',
        'folder/sample.module/fields.js',
        'writeDir'
      );

      fieldsJs.outputPath = 'folder/sample.module/fields.js';

      fieldsJs.saveOutput();
      expect(copyFileSpy).toHaveBeenCalledWith(
        'folder/sample.module/fields.js',
        'folder/sample.module/fields.output.json'
      );
    });

    test('convertFieldsJs returns a Promise', () => {
      const returned = defaultFieldsJs.convertFieldsJs('');
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
