import { FieldsJs, isConvertableFieldJs } from '../cms/handleFieldsJS.js';
import fs from 'fs-extra';
import child_process from 'child_process';
import { vi } from 'vitest';

vi.mock('../fs');
vi.mock('child_process');

describe('lib/cms/handleFieldsJs', () => {
  describe('FieldsJs()', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child_process.fork as any).mockImplementation(() => {
        return {
          pid: 123,
          on: () => {
            return {};
          },
        };
      });
      vi.resetModules();
    });

    const projectRoot = 'folder';
    const filePath = 'folder/sample.module/fields.js';
    const defaultFieldsJs = new FieldsJs(projectRoot, filePath);
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);

    it('getOutputPathPromise() resolves to the correct path', async () => {
      const fieldsJs = new FieldsJs(
        'folder',
        'folder/sample.module/fields.js',
        'temp-dir'
      );
      const convertSpy = vi
        .spyOn(FieldsJs.prototype, 'convertFieldsJs')
        .mockResolvedValue('temp-dir/sample.module/fields.js');

      const returned = fieldsJs.getOutputPathPromise();
      await expect(returned).resolves.toBe('temp-dir/sample.module/fields.js');
      convertSpy.mockRestore();
    });

    it('getWriteDir() returns the correct path', () => {
      const fieldsJs = new FieldsJs(
        'folder',
        'folder/sample.module/fields.js',
        'temp-dir'
      );
      const returned = fieldsJs.getWriteDir();
      expect(returned).toBe('temp-dir/sample.module');
    });

    it('saveOutput() sets the save path correctly', () => {
      const copyFileSpy = vi
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

    it('convertFieldsJs returns a Promise', () => {
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
