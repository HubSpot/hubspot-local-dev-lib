import chokidar from 'chokidar';
import { debounce } from 'debounce';
import PQueue from 'p-queue';
import path from 'path';

import { deleteFile, upload } from '../../api/fileMapper';
import { throwApiError, throwApiUploadError } from '../../errors/apiErrors';
import { StatusCodeError } from '../../types/Error';
import {
  FileMapperInputOptions,
  Mode,
  UploadFolderResults,
} from '../../types/Files';
import { LogCallbacksArg } from '../../types/LogCallbacks';
import { escapeRegExp } from '../../utils/escapeRegExp';
import { debug, makeTypedLogger } from '../../utils/logger';
import { triggerNotify } from '../../utils/notify';
import { getFileMapperQueryValues } from '../fileMapper';
import { ignoreFile, shouldIgnoreFile } from '../ignoreRules';
import { convertToUnixPath, getCwd, isAllowedExtension } from '../path';
import { cleanupTmpDirSync, isConvertableFieldJs } from './FieldsJs';
import { handleFieldsJs } from './handleFieldsJs';
import { getThemeJSONPath, getThemePreviewUrl } from './themes';
import { uploadFolder } from './uploadFolder';

const i18nKey = 'lib.cms.watch';

const watchCallbackKeys = [
  'notifyOfThemePreview',
  'uploadSuccess',
  'deleteSuccess',
  'folderUploadSuccess',
  'ready',
  'deleteSuccessWithType',
] as const;
const makeLogger = makeTypedLogger<typeof watchCallbackKeys>;
type WatchLogCallbacks = LogCallbacksArg<typeof watchCallbackKeys>;

const queue = new PQueue({
  concurrency: 10,
});

function _notifyOfThemePreview(
  filePath: string,
  accountId: number,
  logCallbacks?: WatchLogCallbacks
): void {
  const logger = makeLogger(logCallbacks);
  if (queue.size > 0) return;
  const previewUrl = getThemePreviewUrl(filePath, accountId);
  if (!previewUrl) return;

  logger('notifyOfThemePreview', `${i18nKey}.notifyOfThemePreview`, {
    previewUrl,
  });
}

const notifyOfThemePreview = debounce(_notifyOfThemePreview, 1000);

type UploadFileOptions = FileMapperInputOptions & {
  src: string;
  commandOptions: {
    convertFields?: boolean;
  };
  fieldOptions?: string;
};

async function uploadFile(
  accountId: number,
  file: string,
  dest: string,
  options: UploadFileOptions,
  mode: Mode | null = null,
  logCallbacks?: WatchLogCallbacks
): Promise<void> {
  const logger = makeLogger(logCallbacks);
  const src = options.src;

  const absoluteSrcPath = path.resolve(getCwd(), file);
  const themeJsonPath = getThemeJSONPath(absoluteSrcPath);
  const projectRoot = themeJsonPath
    ? path.dirname(themeJsonPath)
    : path.dirname(getCwd());

  const isFieldsJs = isConvertableFieldJs(
    src,
    file,
    options.commandOptions.convertFields
  );
  let tmpDir: string;

  if (!isAllowedExtension(file) && !isFieldsJs) {
    debug(`${i18nKey}.skipUnsupportedExtension`, { file });
    return;
  }
  if (shouldIgnoreFile(file)) {
    debug(`${i18nKey}.skipIgnoreRule`, { file });
    return;
  }

  let fileToUpload = file;

  if (isFieldsJs) {
    [fileToUpload, tmpDir] = await handleFieldsJs(
      projectRoot,
      absoluteSrcPath,
      false,
      options.fieldOptions
    );
    // Ensures that the dest path is a .json. The user might pass '.js' accidentally - this ensures it just works.
    dest = convertToUnixPath(path.join(path.dirname(dest), 'fields.json'));
  }

  debug(`${i18nKey}.uploadAttempt`, { file, dest });
  const apiOptions = getFileMapperQueryValues(mode, options);
  queue.add(() => {
    return upload(accountId, fileToUpload, dest, apiOptions)
      .then(() => {
        logger('uploadSuccess', `${i18nKey}.uploadSuccess`, { file, dest });
        notifyOfThemePreview(file, accountId, logCallbacks);
      })
      .catch(() => {
        debug(`${i18nKey}.uploadFailed`, { file, dest });
        debug(`${i18nKey}.uploadRetry`, { file, dest });
        return upload(accountId, file, dest, apiOptions).catch(
          (error: StatusCodeError) => {
            debug(`${i18nKey}.uploadFailed`, {
              file,
              dest,
            });
            throwApiUploadError(error, {
              accountId,
              request: dest,
              payload: file,
            });
          }
        );
      })
      .finally(() => {
        if (tmpDir) {
          cleanupTmpDirSync(tmpDir);
        }
      });
  });
}

async function deleteRemoteFile(
  accountId: number,
  filePath: string,
  remoteFilePath: string,
  logCallbacks?: WatchLogCallbacks
): Promise<void> {
  const logger = makeLogger(logCallbacks);
  if (shouldIgnoreFile(filePath)) {
    debug(`${i18nKey}.skipIgnoreRule`, { file: filePath });
    return;
  }

  debug(`${i18nKey}.deleteAttempt`, { remoteFilePath });
  return queue.add(() => {
    return deleteFile(accountId, remoteFilePath)
      .then(() => {
        logger('deleteSuccess', `${i18nKey}.deleteSuccess`, { remoteFilePath });
        notifyOfThemePreview(filePath, accountId, logCallbacks);
      })
      .catch((error: StatusCodeError) => {
        debug(`${i18nKey}.deleteFailed`, {
          remoteFilePath,
        });
        throwApiError(error, {
          accountId,
          request: remoteFilePath,
        });
      });
  });
}

type WatchOptions = {
  mode?: Mode;
  remove?: boolean;
  disableInitial?: boolean;
  notify?: string;
  commandOptions: {
    convertFields?: boolean;
  };
  filePaths?: Array<string>;
};

type ErrorHandler = (error: StatusCodeError) => void;

export function watch(
  accountId: number,
  src: string,
  dest: string,
  {
    mode,
    remove,
    disableInitial,
    notify,
    commandOptions,
    filePaths,
  }: WatchOptions,
  postInitialUploadCallback:
    | ((result: Array<UploadFolderResults>) => void)
    | null = null,
  onUploadFolderError?: ErrorHandler,
  onQueueAddError?: ErrorHandler,
  logCallbacks?: WatchLogCallbacks
) {
  const logger = makeLogger(logCallbacks);
  const regex = new RegExp(`^${escapeRegExp(src)}`);
  if (notify) {
    ignoreFile(notify);
  }

  const watcher = chokidar.watch(src, {
    ignoreInitial: true,
    ignored: (file: string) => shouldIgnoreFile(file),
  });

  function getDesignManagerPath(file: string): string {
    const relativePath = file.replace(regex, '');
    return convertToUnixPath(path.join(dest, relativePath));
  }

  if (!disableInitial) {
    // Use uploadFolder so that failures of initial upload are retried
    const uploadFolderPromise = uploadFolder(
      accountId,
      src,
      dest,
      {},
      commandOptions,
      filePaths,
      mode || null
    ).then(result => {
      logger('folderUploadSuccess', `${i18nKey}.folderUploadSuccess`, {
        src,
        dest,
        accountId,
      });
      if (postInitialUploadCallback) {
        postInitialUploadCallback(result);
      }
    });

    if (onUploadFolderError) {
      uploadFolderPromise.catch(onUploadFolderError);
    }
  }

  watcher.on('ready', () => {
    logger('ready', `${i18nKey}.ready`, { src });
  });

  watcher.on('add', async (filePath: string) => {
    const destPath = getDesignManagerPath(filePath);
    const uploadPromise = uploadFile(
      accountId,
      filePath,
      destPath,
      {
        src,
        commandOptions,
      },
      mode,
      logCallbacks
    );
    triggerNotify(notify, 'Added', filePath, uploadPromise);
  });

  if (remove) {
    const deleteFileOrFolder =
      (type: 'file' | 'folder') => (filePath: string) => {
        // If it's a fields.js file that is in a module folder or the root, then ignore because it will not exist on the server.
        if (isConvertableFieldJs(src, filePath, commandOptions.convertFields)) {
          return;
        }

        const remotePath = getDesignManagerPath(filePath);
        if (shouldIgnoreFile(filePath)) {
          debug(`${i18nKey}.skipIgnoreRule`, { file: filePath });
          return;
        }

        debug(`${i18nKey}.deleteAttemptWithType`, {
          type,
          remoteFilePath: remotePath,
        });
        const queueAddPromise = queue.add(() => {
          const deletePromise = deleteRemoteFile(
            accountId,
            filePath,
            remotePath,
            logCallbacks
          ).then(() => {
            logger(
              'deleteSuccessWithType',
              `${i18nKey}.deleteSuccessWithType`,
              {
                type,
                remoteFilePath: remotePath,
              }
            );
          });

          if (onQueueAddError) {
            queueAddPromise.catch(onQueueAddError);
          }
          triggerNotify(notify, 'Removed', filePath, deletePromise);
          return deletePromise;
        });
      };

    watcher.on('unlink', deleteFileOrFolder('file'));
    watcher.on('unlinkDir', deleteFileOrFolder('folder'));
  }

  watcher.on('change', async (filePath: string) => {
    const destPath = getDesignManagerPath(filePath);
    const uploadPromise = uploadFile(
      accountId,
      filePath,
      destPath,
      {
        src,
        commandOptions,
      },
      mode,
      logCallbacks
    );
    triggerNotify(notify, 'Changed', filePath, uploadPromise);
  });

  return watcher;
}
