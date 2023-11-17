import fs from 'fs-extra';
import path from 'path';
import { upload as __upload } from '../../api/fileMapper';
import { FILE_TYPES } from '../../constants/files';
import {
  FieldsJs as __FieldsJs,
  cleanupTmpDirSync as __cleanupTmpDirSync,
  createTmpDirSync as __createTmpDirSync,
  isConvertableFieldJs as __isConvertableFields,
} from '../cms/FieldsJs';
import { getFilesByType, uploadFolder } from '../cms/uploadFolder';
import { walk as __walk } from '../fs';
import { createIgnoreFilter as __createIgnoreFilter } from '../ignoreRules';

jest.mock('../fs');
jest.mock('../../api/fileMapper');
jest.mock('../ignoreRules');
jest.mock('../cms/FieldsJs');

const listFilesInDir = jest.fn((dir: string) => {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(file => !file.isDirectory())
    .map(file => file.name);
});

const FieldsJs = __FieldsJs as jest.Mock;
const isConvertableFieldJs = __isConvertableFields as jest.MockedFunction<
  typeof __isConvertableFields
>;
const createIgnoreFilter = __createIgnoreFilter as jest.MockedFunction<
  typeof __createIgnoreFilter
>;
const createTmpDirSync = __createTmpDirSync as jest.MockedFunction<
  typeof __createTmpDirSync
>;
const walk = __walk as jest.MockedFunction<typeof __walk>;
const upload = __upload as jest.MockedFunction<typeof __upload>;
const cleanupTmpDirSync = __cleanupTmpDirSync as jest.MockedFunction<
  typeof __cleanupTmpDirSync
>;

//folder/fields.js -> folder/fields.converted.js
// We add the .converted to differentiate from a unconverted fields.json
FieldsJs.mockImplementation(
  (projectDir: string, pathToFieldsJs: string, fieldOptions = '') => {
    const outputPath = (pathToFieldsJs: string) =>
      pathToFieldsJs.substring(0, pathToFieldsJs.lastIndexOf('.')) +
      '.converted.json';
    return {
      projectDir,
      pathToFieldsJs,
      fieldOptions,
      rejected: false,
      convert: jest.fn().mockImplementation(() => ''),
      getWritePath: jest
        .fn()
        .mockImplementation(() => outputPath(pathToFieldsJs)),
    };
  }
);

FieldsJs.mockImplementation();

isConvertableFieldJs.mockImplementation((rootDir: string, filePath: string) => {
  const fileName = path.basename(filePath);
  return fileName === 'fields.js';
});

const filesProto = [
  'folder/templates/blog.html',
  'folder/css/file.css',
  'folder/js/file.js',
  'folder/fields.json',
  'folder/images/image.png',
  'folder/images/image.jpg',
  'folder/sample.module/module.css',
  'folder/sample.module/module.js',
  'folder/sample.module/meta.json',
  'folder/sample.module/module.html',
  'folder/templates/page.html',
];
describe('lib/cms/uploadFolder', () => {
  beforeAll(() => {
    createIgnoreFilter.mockImplementation(() => () => true);
  });
  beforeEach(() => {
    FieldsJs.mockClear();
    createTmpDirSync.mockReset();
    listFilesInDir.mockReset();
  });

  describe('uploadFolder()', () => {
    it('uploads files in the correct order', async () => {
      listFilesInDir.mockReturnValue(['fields.json']);
      walk.mockResolvedValue(filesProto);
      upload.mockResolvedValue();

      const uploadedFilesInOrder = [
        'folder/images/image.png',
        'folder/images/image.jpg',
        'folder/sample.module/module.css',
        'folder/sample.module/module.js',
        'folder/sample.module/meta.json',
        'folder/sample.module/module.html',
        'folder/css/file.css',
        'folder/js/file.js',
        'folder/templates/blog.html',
        'folder/templates/page.html',
        'folder/fields.json',
      ];

      await uploadFolder(
        123,
        'folder',
        'folder',
        {},
        { saveOutput: true, convertFields: false },
        uploadedFilesInOrder,
        'publish'
      );
      expect(upload).toReturnTimes(11);
      uploadedFilesInOrder.forEach((file, index) => {
        expect(upload).nthCalledWith(index + 1, 123, file, file, {
          params: { buffer: false, environmentId: 1 },
        });
      });
    });

    it('tries to save output of each fields file', async () => {
      const copyFileSpy = jest.spyOn(fs, 'copyFileSync');

      createTmpDirSync.mockReturnValue('folder');
      upload.mockResolvedValue();

      await uploadFolder(
        123,
        'folder',
        'folder',
        {},
        { saveOutput: true, convertFields: true },
        ['folder/fields.js', 'folder/sample.module/fields.js'],
        'publish'
      );

      expect(copyFileSpy).toHaveBeenCalledTimes(2);
    });

    it('deletes the temporary directory', async () => {
      const deleteDirSpy = cleanupTmpDirSync.mockImplementation(() => '');

      upload.mockResolvedValue();

      await uploadFolder(
        123,
        'folder',
        'folder',
        {},
        { saveOutput: true, convertFields: true },
        [],
        'publish'
      );
      expect(deleteDirSpy).toHaveBeenCalledWith('folder');
    });
  });

  describe('getFilesByType()', () => {
    beforeEach(() => {
      FieldsJs.mockClear();
      jest.resetModules();
    });
    it('outputs getFilesByType with no processing if convertFields is false', async () => {
      const files = [...filesProto];
      files.push('folder/sample.module/fields.js');
      const filesByType = await getFilesByType(files, 'folder', {
        convertFields: false,
      });

      expect(filesByType).toEqual({
        [FILE_TYPES.other]: [
          'folder/images/image.png',
          'folder/images/image.jpg',
        ],
        [FILE_TYPES.module]: [
          'folder/sample.module/module.css',
          'folder/sample.module/module.js',
          'folder/sample.module/meta.json',
          'folder/sample.module/module.html',
          'folder/sample.module/fields.js',
        ],
        [FILE_TYPES.cssAndJs]: ['folder/css/file.css', 'folder/js/file.js'],
        [FILE_TYPES.template]: [
          'folder/templates/blog.html',
          'folder/templates/page.html',
        ],
        [FILE_TYPES.json]: ['folder/fields.json'],
        [FILE_TYPES.fieldsJs]: [],
      });
    });

    it('finds fields.js files ', async () => {
      const files = [...filesProto];
      files.push('folder/fields.js', 'folder/sample.module/fields.js');
      const filesByType = await getFilesByType(files, 'folder', {
        convertFields: true,
      });

      expect(filesByType).toEqual({
        [FILE_TYPES.other]: [
          'folder/images/image.png',
          'folder/images/image.jpg',
        ],
        [FILE_TYPES.module]: [
          'folder/sample.module/module.css',
          'folder/sample.module/module.js',
          'folder/sample.module/meta.json',
          'folder/sample.module/module.html',
        ],
        [FILE_TYPES.cssAndJs]: ['folder/css/file.css', 'folder/js/file.js'],
        [FILE_TYPES.template]: [
          'folder/templates/blog.html',
          'folder/templates/page.html',
        ],
        [FILE_TYPES.json]: ['folder/fields.json'],
        [FILE_TYPES.fieldsJs]: [
          'folder/fields.js',
          'folder/sample.module/fields.js',
        ],
      });
    });

    it('does not add fields.json if fields.js is present in same directory', async () => {
      const files = ['folder/fields.js', 'folder/fields.json'];
      const filesByType = await getFilesByType(files, 'folder', {
        convertFields: true,
      });
      expect(filesByType).not.toMatchObject({
        [FILE_TYPES.json]: ['folder/fields.json'],
      });
    });
  });
});
