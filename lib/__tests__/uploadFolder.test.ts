import path from 'path';
import fs from 'fs-extra';
import { uploadFolder, getFilesByType } from '../cms/uploadFolder';
import { FILE_TYPES } from '../../constants/files';
import { upload as __upload } from '../../api/fileMapper';
import { walk as __walk } from '../fs';
import { createIgnoreFilter as __createIgnoreFilter } from '../ignoreRules';
import {
  FieldsJs as __FieldsJs,
  isConvertableFieldJs as __isConvertableFields,
  cleanupTmpDirSync as __cleanupTmpDirSync,
  createTmpDirSync as __createTmpDirSync,
} from '../cms/handleFieldsJS';

jest.mock('../fs');
jest.mock('../../api/fileMapper');
jest.mock('../ignoreRules');
jest.mock('../cms/handleFieldsJS');

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
const defaultFieldsJsImplementation = jest.fn(
  (src: string, filePath: string, rootWriteDir: string | undefined | null) => {
    const fieldsJs = Object.create(FieldsJs.prototype);
    const outputPath =
      filePath.substring(0, filePath.lastIndexOf('.')) + '.converted.json';
    return {
      init: jest.fn().mockReturnValue(
        Object.assign(fieldsJs, {
          src,
          outputPath,
          rootWriteDir,
          getOutputPathPromise: jest.fn().mockResolvedValue(outputPath),
          rejected: false,
        })
      ),
    };
  }
);
FieldsJs.mockImplementation(defaultFieldsJsImplementation);

isConvertableFieldJs.mockImplementation((src: string, filePath: string) => {
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

    it('creates a temp directory if --convertFields is true', async () => {
      const tmpDirSpy = createTmpDirSync.mockImplementation(() => '');

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
      expect(tmpDirSpy).toHaveBeenCalled();
    });

    it('tries to save output of each fields file', async () => {
      const saveOutputSpy = jest.spyOn(FieldsJs.prototype, 'saveOutput');

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

      expect(saveOutputSpy).toHaveBeenCalledTimes(2);
    });

    it('deletes the temporary directory', async () => {
      createTmpDirSync.mockReturnValue('folder');
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
    const convertedFieldsObj = new FieldsJs(
      'folder',
      'folder/fields.json',
      'folder'
    ).init();
    const convertedFilePath = convertedFieldsObj.outputPath;

    const convertedModuleFieldsObj = new FieldsJs(
      'folder',
      'folder/sample.module/fields.json',
      'folder'
    ).init();
    const convertedModuleFilePath = convertedModuleFieldsObj.outputPath;

    beforeEach(() => {
      jest.resetModules();
    });
    it('outputs getFilesByType with no processing if convertFields is false', async () => {
      const files = [...filesProto];
      files.push('folder/sample.module/fields.js');
      const [filesByType] = await getFilesByType(files, 'folder', 'folder', {
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
      });
    });

    it('finds and converts fields.js files to field.json', async () => {
      const files = [...filesProto];
      files.push('folder/fields.js', 'folder/sample.module/fields.js');
      listFilesInDir.mockReturnValue(['fields.json']);
      const [filesByType, fieldsJsObjects] = await getFilesByType(
        files,
        'folder',
        'folder',
        { convertFields: true }
      );

      const filesByTypeValues = Object.values(filesByType);
      expect(filesByTypeValues[1]).toEqual([
        'folder/sample.module/module.css',
        'folder/sample.module/module.js',
        'folder/sample.module/meta.json',
        'folder/sample.module/module.html',
        convertedModuleFilePath,
      ]);
      expect(filesByTypeValues[4]).toContainEqual(convertedFilePath);
      expect(JSON.stringify(fieldsJsObjects)).toBe(
        JSON.stringify([convertedFieldsObj, convertedModuleFieldsObj])
      );
    });

    it('does not add fields.json if fields.js is present in same directory', async () => {
      const files = ['folder/fields.js', 'folder/fields.json'];
      listFilesInDir.mockReturnValue(['fields.json', 'fields.js']);
      const [filesByType] = await getFilesByType(files, 'folder', 'folder', {
        convertFields: true,
      });
      expect(filesByType).not.toMatchObject({
        [FILE_TYPES.json]: ['folder/fields.json'],
      });
    });

    it('adds root fields.js to jsonFiles', async () => {
      const files = ['folder/fields.js'];
      const [filesByType, fieldsJsObjects] = await getFilesByType(
        files,
        'folder',
        'folder',
        { convertFields: true }
      );
      expect(filesByType).toMatchObject({
        [FILE_TYPES.json]: [convertedFilePath],
      });

      expect(JSON.stringify(fieldsJsObjects)).toEqual(
        JSON.stringify([convertedFieldsObj])
      );
    });

    it('adds module fields.js to moduleFiles', async () => {
      const files = ['folder/sample.module/fields.js'];
      const [filesByType, fieldsJsObjects] = await getFilesByType(
        files,
        'folder',
        'folder',
        { convertFields: true }
      );

      expect(filesByType).toMatchObject({
        [FILE_TYPES.module]: [convertedModuleFilePath],
      });

      expect(JSON.stringify(fieldsJsObjects)).toBe(
        JSON.stringify([convertedModuleFieldsObj])
      );
    });
  });
});
