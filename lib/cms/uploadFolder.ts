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
import { isModuleFolderChild, isModuleNew } from '../../utils/cms/modules';
import { escapeRegExp } from '../escapeRegExp';
import { convertToUnixPath, getExt } from '../path';
import { isAuthError, isHubSpotHttpError } from '../../errors';
import { FileMapperInputOptions } from '../../types/Files';
import { logger } from '../logger';
import { FILE_TYPES, FILE_UPLOAD_RESULT_TYPES } from '../../constants/files';
import {
  FileType,
  UploadFolderResults,
  CommandOptions,
  FilePathsByType,
} from '../../types/Files';
import { CmsPublishMode } from '../../types/Files';
import { i18n } from '../../utils/lang';
import { HubSpotHttpError } from '../../models/HubSpotHttpError';

const i18nKey = 'lib.cms.uploadFolder';

const queue = new PQueue({
  concurrency: 10,
});

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

function isMetaJsonFile(filePath: string): boolean {
  return path.basename(filePath).toLowerCase() === 'meta.json';
}

function resolveUploadPath(
  file: string,
  fieldsJsPaths: Array<Partial<FieldsJs>>,
  tmpDirRegex: RegExp,
  regex: RegExp,
  dest: string
) {
  const fieldsJsFileInfo = fieldsJsPaths.find(f => f.outputPath === file);
  const relativePath = file.replace(fieldsJsFileInfo ? tmpDirRegex : regex, '');
  const destPath = convertToUnixPath(path.join(dest, relativePath));
  const originalFilePath = fieldsJsFileInfo ? fieldsJsFileInfo.filePath : file;

  return { fieldsJsFileInfo, relativePath, destPath, originalFilePath };
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

const defaultUploadAttemptCallback = (
  file: string | undefined,
  destPath: string
) =>
  logger.debug(
    i18n(`${i18nKey}.uploadFolder.attempt`, {
      file: file || '',
      destPath,
    })
  );
const defaultUploadSuccessCallback = (
  file: string | undefined,
  destPath: string
) =>
  logger.log(
    i18n(`${i18nKey}.uploadFolder.success`, {
      file: file || '',
      destPath,
    })
  );
const defaultUploadFirstErrorCallback = (
  file: string,
  destPath: string,
  error: unknown
) => {
  logger.debug(i18n(`${i18nKey}.uploadFolder.failed`, { file, destPath }));
  if (isHubSpotHttpError(error)) {
    logger.debug(error.data);
  } else if (error instanceof Error) {
    logger.debug(error.message);
  }
};
const defaultUploadRetryCallback = (file: string, destPath: string) =>
  logger.debug(i18n(`${i18nKey}.uploadFolder.retry`, { file, destPath }));
const defaultUploadFinalErrorCallback = (
  accountId: number,
  file: string,
  destPath: string,
  error: unknown
) => {
  const retryFailed = i18n(`${i18nKey}.uploadFolder.retryFailed`, {
    file,
    destPath,
  });
  logger.debug(retryFailed);
  throw new HubSpotHttpError(
    retryFailed,
    { cause: error },
    {
      accountId,
      request: destPath,
      payload: file,
    }
  );
};

async function processNewModulesMetaFiles(
  accountId: number,
  moduleFiles: string[],
  fieldsJsPaths: Array<Partial<FieldsJs>>,
  tmpDirRegex: RegExp,
  regex: RegExp,
  dest: string,
  apiOptions: any,
  _onAttemptCallback: (file: string | undefined, destPath: string) => void,
  _onSuccessCallback: (file: string | undefined, destPath: string) => void,
  _onFirstErrorCallback: (
    file: string,
    destPath: string,
    error: unknown
  ) => void,
  failures: Array<{ file: string; destPath: string }>
): Promise<string[]> {
  const moduleMetaJsonFiles = moduleFiles.filter(isMetaJsonFile);
  const remainingMetaJsonFiles: string[] = [];

  // Batch check which modules are new - parallelize API calls for better performance
  const moduleChecks = await Promise.allSettled(
    moduleMetaJsonFiles.map(async metaFile => {
      const pathInfo = resolveUploadPath(
        metaFile,
        fieldsJsPaths,
        tmpDirRegex,
        regex,
        dest
      );
      const modulePath = path.dirname(pathInfo.destPath);
      const isNew = await isModuleNew(accountId, modulePath, apiOptions);
      return { metaFile, isNew, pathInfo };
    })
  );

  // Process results and upload net-new meta.json files sequentially
  for (let i = 0; i < moduleChecks.length; i++) {
    const result = moduleChecks[i];
    const metaFile = moduleMetaJsonFiles[i];

    if (result.status === 'fulfilled') {
      const { isNew, pathInfo } = result.value;

      if (isNew) {
        // Upload net-new meta.json file immediately using cached path info
        const { originalFilePath, destPath } = pathInfo;
        _onAttemptCallback(originalFilePath, destPath);

        try {
          await upload(accountId, metaFile, destPath, apiOptions);
          _onSuccessCallback(originalFilePath, destPath);
        } catch (err) {
          if (isAuthError(err)) {
            throw err;
          }
          _onFirstErrorCallback(metaFile, destPath, err);
          failures.push({ file: metaFile, destPath });
        }
      } else {
        // Add existing module meta.json to regular upload queue
        remainingMetaJsonFiles.push(metaFile);
      }
    } else {
      // If module check failed, add to regular queue to be safe
      logger.debug(
        `Module existence check failed for ${path.basename(metaFile)}: ${result.reason}`
      );
      remainingMetaJsonFiles.push(metaFile);
    }
  }

  return remainingMetaJsonFiles;
}
export async function uploadFolder(
  accountId: number,
  src: string,
  dest: string,
  fileMapperOptions: FileMapperInputOptions,
  commandOptions: CommandOptions = {},
  filePaths: Array<string> = [],
  cmsPublishMode: CmsPublishMode | null = null
): Promise<Array<UploadFolderResults>> {
  const {
    saveOutput,
    convertFields,
    onAttemptCallback,
    onSuccessCallback,
    onFirstErrorCallback,
    onRetryCallback,
    onFinalErrorCallback,
  } = commandOptions;

  const _onAttemptCallback = onAttemptCallback || defaultUploadAttemptCallback;
  const _onSuccessCallback = onSuccessCallback || defaultUploadSuccessCallback;
  const _onFirstErrorCallback =
    onFirstErrorCallback || defaultUploadFirstErrorCallback;
  const _onRetryCallback = onRetryCallback || defaultUploadRetryCallback;
  const _onFinalErrorCallback =
    onFinalErrorCallback || defaultUploadFinalErrorCallback;

  const tmpDir = convertFields
    ? createTmpDirSync('hubspot-temp-fieldsjs-output-')
    : null;
  const regex = new RegExp(`^${escapeRegExp(src)}`);

  const apiOptions = getFileMapperQueryValues(
    cmsPublishMode,
    fileMapperOptions
  );
  const failures: Array<{ file: string; destPath: string }> = [];
  let fieldsJsPaths: Array<Partial<FieldsJs>> = [];
  let tmpDirRegex: RegExp;

  const [filesByType, fieldsJsObjects] = await getFilesByType(
    filePaths,
    src,
    tmpDir,
    commandOptions
  );

  if (fieldsJsObjects.length) {
    fieldsJsPaths = fieldsJsObjects.map(fieldsJs => {
      return { outputPath: fieldsJs.outputPath, filePath: fieldsJs.filePath };
    });
    tmpDirRegex = new RegExp(`^${escapeRegExp(tmpDir || '')}`);
  }

  function uploadFile(file: string): () => Promise<void> {
    const { originalFilePath, destPath } = resolveUploadPath(
      file,
      fieldsJsPaths,
      tmpDirRegex,
      regex,
      dest
    );
    return async () => {
      _onAttemptCallback(originalFilePath, destPath);
      try {
        await upload(accountId, file, destPath, apiOptions);
        _onSuccessCallback(originalFilePath, destPath);
      } catch (err) {
        if (isAuthError(err)) {
          throw err;
        }
        _onFirstErrorCallback(file, destPath, err);
        failures.push({
          file,
          destPath,
        });
      }
    };
  }

  // Process new modules first, then collect remaining files to upload
  const remainingMetaJsonFiles = await processNewModulesMetaFiles(
    accountId,
    filesByType[FILE_TYPES.module] || [],
    fieldsJsPaths,
    tmpDirRegex,
    regex,
    dest,
    apiOptions,
    _onAttemptCallback,
    _onSuccessCallback,
    _onFirstErrorCallback,
    failures
  );
  const deferredFiles: string[] = [];

  // Upload all remaining files concurrently
  Object.entries(filesByType).forEach(([fileType, files]) => {
    if (fileType === FILE_TYPES.module) {
      // Add meta.json files that weren't uploaded as new modules
      deferredFiles.push(...remainingMetaJsonFiles);
      // Add non-meta.json module files
      deferredFiles.push(...files.filter(f => !isMetaJsonFile(f)));
    } else {
      // Add all non-module files
      deferredFiles.push(...files);
    }
  });

  if (deferredFiles.length > 0) {
    await queue.addAll(deferredFiles.map(uploadFile));
  }

  const results = await queue
    .addAll(
      failures.map(({ file, destPath }) => {
        return async () => {
          _onRetryCallback(file, destPath);
          try {
            await upload(accountId, file, destPath, apiOptions);
            _onSuccessCallback(file, destPath);
            return {
              resultType: FILE_UPLOAD_RESULT_TYPES.SUCCESS,
              error: null,
              file,
            };
          } catch (error) {
            if (isAuthError(error)) {
              throw error;
            }
            _onFinalErrorCallback(accountId, file, destPath, error);
            return {
              resultType: FILE_UPLOAD_RESULT_TYPES.FAILURE,
              error,
              file,
            };
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
