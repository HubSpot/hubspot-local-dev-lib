import PQueue from 'p-queue';
import path from 'path';

import { upload } from '../../api/fileMapper';
import { FILE_TYPES, FILE_UPLOAD_RESULT_TYPES } from '../../constants/files';
import { throwApiUploadError } from '../../errors/apiErrors';
import { isFatalError } from '../../errors/standardErrors';
import { StatusCodeError } from '../../types/Error';
import {
  FileMapperInputOptions,
  FileType,
  Mode,
  UploadFolderResults,
} from '../../types/Files';
import { LogCallbacksArg } from '../../types/LogCallbacks';
import { isModuleFolderChild } from '../../utils/cms/modules';
import { escapeRegExp } from '../../utils/escapeRegExp';
import { debug, makeTypedLogger } from '../../utils/logger';
import { getFileMapperQueryValues } from '../fileMapper';
import { convertToUnixPath, getCwd, getExt } from '../path';
import { cleanupTmpDirSync, isConvertableFieldJs } from './FieldsJs';
import { handleMultipleFieldsJs } from './handleFieldsJs';
import { getThemeJSONPath } from './themes';

const i18nKey = 'lib.cms.uploadFolder';

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

export function getFilesByType(
  filePaths: Array<string>,
  projectDir: string,
  commandOptions: CommandOptions
): FilePathsByType {
  const { convertFields } = commandOptions;

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

    if (!convertFields) {
      filePathsByType[fileType].push(filePath);
      continue;
    }

    const isFieldsJs = isConvertableFieldJs(
      projectDir,
      filePath,
      convertFields
    );

    filePathsByType[isFieldsJs ? FILE_TYPES.fieldsJs : fileType].push(filePath);
  }
  return filePathsByType;
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
  const logger = makeTypedLogger<typeof uploadFolderCallbackKeys>(logCallbacks);
  const { saveOutput, convertFields, fieldOptions } = commandOptions;
  const regex = new RegExp(`^${escapeRegExp(src)}`);

  let tmpDir: string;
  const themeJsonPath = getThemeJSONPath(src);
  const projectRoot = themeJsonPath
    ? path.dirname(themeJsonPath)
    : path.dirname(getCwd());

  const apiOptions = getFileMapperQueryValues(mode, fileMapperOptions);
  const failures: Array<{ file: string; destPath: string }> = [];

  const filesByType = await getFilesByType(filePaths, src, commandOptions);
  const fileList = Object.values(filesByType);
  const fieldsJsPaths: Array<string> = filesByType[FILE_TYPES.fieldsJs];
  const containsFieldsJs = fieldsJsPaths.length;

  if (containsFieldsJs) {
    let fieldsJsOutput: string[];
    [fieldsJsOutput, tmpDir] = await handleMultipleFieldsJs(
      fieldsJsPaths,
      projectRoot,
      !!saveOutput,
      fieldOptions
    );
    fileList.push([...fieldsJsOutput]);
  }

  function uploadFile(file: string): () => Promise<void> {
    const relativePath = file.replace(regex, '');
    const destPath = convertToUnixPath(path.join(dest, relativePath));
    return async () => {
      debug(`${i18nKey}.uploadFolder.attempt`, {
        file: file || '',
        destPath,
      });
      try {
        await upload(accountId, file, destPath, apiOptions);
        logger('success', `${i18nKey}.uploadFolder.success`, {
          file: file || '',
          destPath,
        });
      } catch (err) {
        const error = err as StatusCodeError;
        if (isFatalError(error)) {
          throw error;
        }
        debug(`${i18nKey}.uploadFolder.failed`, { file, destPath });
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
          debug(`${i18nKey}.uploadFolder.retry`, { file, destPath });
          try {
            await upload(accountId, file, destPath, apiOptions);
            logger('success', `${i18nKey}.uploadFolder.success`, {
              file,
              destPath,
            });
            return {
              resultType: FILE_UPLOAD_RESULT_TYPES.SUCCESS,
              error: null,
              file,
            };
          } catch (err) {
            debug(`${i18nKey}.uploadFolder.retryFailed`, { file, destPath });
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
      if (tmpDir) {
        cleanupTmpDirSync(tmpDir || '');
      }
    });

  return results;
}

export function hasUploadErrors(results: Array<UploadFolderResults>): boolean {
  return results.some(
    result => result.resultType === FILE_UPLOAD_RESULT_TYPES.FAILURE
  );
}
