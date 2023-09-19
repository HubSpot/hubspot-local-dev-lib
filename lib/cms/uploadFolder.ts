import path from 'path';
import PQueue from 'p-queue';

import {
  isConvertableFieldJs,
  FieldsJs,
  createTmpDirSync,
  cleanupTmpDirSync,
} from './handleFieldsJS';
import { getFileMapperQueryValues } from '../fileMapper';
import { upload } from '../../api/fileMapper';
import { isModuleFolderChild } from '../../utils/modules';
import { escapeRegExp } from '../../utils/escapeRegExp';
import { debug } from '../../utils/logger';
import { convertToUnixPath, getExt } from '../path';
import { isFatalError } from '../../errors/standardErrors';
import { throwApiUploadError } from '../../errors/apiErrors';
import { FileMapperInputOptions } from '../../types/Files';
import { LogCallbacksArg } from '../../types/LogCallbacks';
import { makeTypedLogger } from '../../utils/logger';
import { StatusCodeError } from '../../types/Error';
import { FILE_TYPES, FILE_UPLOAD_RESULT_TYPES } from '../../constants/files';
import { FileType, UploadFolderResults } from '../../types/Files';
import { Mode } from '../../types/Files';

const queue = new PQueue({
  concurrency: 10,
});

type CommandOptions = {
  convertFields?: boolean;
  fieldOptions?: string;
  saveOutput?: boolean;
};

type FilePathsByType = {
  [key: string]: Array<string>;
};

function getFileType(filePath: string): FileType {
  const extension = getExt(filePath);
  const moduleFolder = isModuleFolderChild({ path: filePath, isLocal: true });
  if (moduleFolder) return FILE_TYPES.module;

  switch (extension) {
    case 'js':
    case 'css':
      return FILE_TYPES.cssAndJs;
    case 'html':
      return FILE_TYPES.template;
    case 'json':
      return FILE_TYPES.json;
    default:
      return FILE_TYPES.other;
  }
}

export async function getFilesByType(
  filePaths: Array<string>,
  projectDir: string,
  rootWriteDir: string | null,
  commandOptions: CommandOptions
): Promise<[FilePathsByType, Array<FieldsJs>]> {
  const { convertFields, fieldOptions } = commandOptions;
  const projectDirRegex = new RegExp(`^${escapeRegExp(projectDir)}`);
  const fieldsJsObjects = [];

  // Create object with key-value pairs of form { FileType.type: [] }
  const filePathsByType = Object.values<FileType>(
    FILE_TYPES
  ).reduce<FilePathsByType>((acc: FilePathsByType, fileType: FileType) => {
    return {
      ...acc,
      [fileType]: [],
    };
  }, {});

  for (const filePath of filePaths) {
    const fileType = getFileType(filePath);
    const relPath = filePath.replace(projectDirRegex, '');

    if (!convertFields) {
      filePathsByType[fileType].push(filePath);
      continue;
    }

    const convertableFields = isConvertableFieldJs(
      projectDir,
      filePath,
      convertFields
    );

    if (convertableFields) {
      const rootOrModule =
        path.dirname(relPath) === '/' ? FILE_TYPES.json : FILE_TYPES.module;
      const fieldsJs = await new FieldsJs(
        projectDir,
        filePath,
        rootWriteDir,
        fieldOptions
      ).init();

      /*
       * A fields.js will be rejected if the promise is rejected or if the some other error occurs.
       * We handle this gracefully by not adding the failed fields.js to the object list.
       */
      if (fieldsJs.rejected) continue;

      fieldsJsObjects.push(fieldsJs);
      filePathsByType[rootOrModule].push(fieldsJs.outputPath || '');
    } else {
      filePathsByType[fileType].push(filePath);
    }
  }
  return [filePathsByType, fieldsJsObjects];
}

const uploadFolderCallbackKeys = ['success'];

export async function uploadFolder(
  accountId: number,
  src: string,
  dest: string,
  fileMapperOptions: FileMapperInputOptions,
  commandOptions: CommandOptions = {},
  filePaths: Array<string> = [],
  mode: Mode | null = null,
  logCallbacks?: LogCallbacksArg<typeof uploadFolderCallbackKeys>
): Promise<Array<UploadFolderResults>> {
  const logger = makeTypedLogger<typeof uploadFolderCallbackKeys>(
    logCallbacks,
    'cms.uploadFolder'
  );
  const { saveOutput, convertFields } = commandOptions;
  const tmpDir = convertFields
    ? createTmpDirSync('hubspot-temp-fieldsjs-output-')
    : null;
  const regex = new RegExp(`^${escapeRegExp(src)}`);

  const apiOptions = getFileMapperQueryValues(mode, fileMapperOptions);
  const failures: Array<{ file: string; destPath: string }> = [];
  let fieldsJsPaths: Array<Partial<FieldsJs>> = [];
  let tmpDirRegex: RegExp;

  const [filesByType, fieldsJsObjects] = await getFilesByType(
    filePaths,
    src,
    tmpDir,
    commandOptions
  );
  const fileList = Object.values(filesByType);
  if (fieldsJsObjects.length) {
    fieldsJsPaths = fieldsJsObjects.map(fieldsJs => {
      return { outputPath: fieldsJs.outputPath, filePath: fieldsJs.filePath };
    });
    tmpDirRegex = new RegExp(`^${escapeRegExp(tmpDir || '')}`);
  }

  function uploadFile(file: string): () => Promise<void> {
    const fieldsJsFileInfo = fieldsJsPaths.find(f => f.outputPath === file);
    const originalFilePath = fieldsJsFileInfo
      ? fieldsJsFileInfo.filePath
      : file;

    // files in fieldsJsPaths always belong to the tmp directory.
    const relativePath = file.replace(
      fieldsJsFileInfo ? tmpDirRegex : regex,
      ''
    );
    const destPath = convertToUnixPath(path.join(dest, relativePath));
    return async () => {
      debug('cms.uploadFolder.attempt', {
        file: originalFilePath || '',
        destPath,
      });
      try {
        await upload(accountId, file, destPath, apiOptions);
        logger('success', {
          file: originalFilePath || '',
          destPath,
        });
      } catch (err) {
        const error = err as StatusCodeError;
        if (isFatalError(error)) {
          throw error;
        }
        debug('cms.uploadFolder.failed', { file, destPath });
        if (error.response && error.response.body) {
          console.debug(error.response.body);
        } else {
          console.debug(error.message);
        }
        failures.push({
          file,
          destPath,
        });
      }
    };
  }

  for (let i = 0; i < fileList.length; i++) {
    const filesToUpload = fileList[i];
    await queue.addAll(filesToUpload.map(uploadFile));
  }

  const results = await queue
    .addAll(
      failures.map(({ file, destPath }) => {
        return async () => {
          debug('cms.uploadFolder.retry', { file, destPath });
          try {
            await upload(accountId, file, destPath, apiOptions);
            logger('success', { file, destPath });
            return {
              resultType: FILE_UPLOAD_RESULT_TYPES.SUCCESS,
              error: null,
              file,
            };
          } catch (err) {
            debug('cms.uploadFolder.retryFailed', { file, destPath });
            const error = err as StatusCodeError;
            if (isFatalError(error)) {
              throw error;
            }
            throwApiUploadError(error, {
              accountId,
              request: destPath,
              payload: file,
            });
          }
        };
      })
    )
    .finally(() => {
      if (!convertFields) return;
      if (saveOutput) {
        fieldsJsObjects.forEach(fieldsJs => fieldsJs.saveOutput());
      }
      cleanupTmpDirSync(tmpDir || '');
    });

  return results;
}

export function hasUploadErrors(results: Array<UploadFolderResults>): boolean {
  return results.some(
    result => result.resultType === FILE_UPLOAD_RESULT_TYPES.FAILURE
  );
}
