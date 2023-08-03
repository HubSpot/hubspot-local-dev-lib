import path from 'path';
import chokidar from 'chokidar';
import PQueue from 'p-queue';
import { debounce } from 'debounce';

import { throwApiError, throwApiUploadError } from '../../errors/apiErrors';
import { throwError } from '../../errors/standardErrors';
import { isConvertableFieldJs, FieldsJs } from './handleFieldsJS';
import { uploadFolder } from './uploadFolder';
import { shouldIgnoreFile, ignoreFile } from '../ignoreRules';
import { getFileMapperQueryValues } from '../fileMapper';
import { upload, deleteFile } from '../../api/fileMapper';
import { escapeRegExp } from '../../utils/escapeRegExp';
import { convertToUnixPath, isAllowedExtension, getCwd } from '../path';
import { triggerNotify } from '../../utils/notify';
import { getThemePreviewUrl, getThemeJSONPath } from './themes';
import { LogCallbacksArg } from '../../types/LogCallbacks';
import { makeTypedLogger } from '../../utils/logger';
import { debug } from '../../utils/logger';
import { FileMapperInputOptions, Mode } from '../../types/Files';
import { UploadFolderResults } from '../../types/Files';

const watchCallbackKeys = [
  'notifyOfThemePreview',
  'uploadSuccess',
  'deleteSuccess',
] as const;
const makeLogger = makeTypedLogger<typeof watchCallbackKeys>;
type WatchLogCallbacks = LogCallbacksArg<typeof watchCallbackKeys>;

const queue = new PQueue({
  concurrency: 10,
});

function _notifyOfThemePreview(
  filePath: string,
  accountId: number,
  logCallbacks: WatchLogCallbacks
): void {
  const logger = makeLogger(logCallbacks, 'watch');
  if (queue.size > 0) return;
  const previewUrl = getThemePreviewUrl(filePath, accountId);
  if (!previewUrl) return;

  logger('notifyOfThemePreview', { previewUrl });
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
  logCallbacks: WatchLogCallbacks
) {
  const logger = makeLogger(logCallbacks, 'watch');
  const src = options.src;

  const absoluteSrcPath = path.resolve(getCwd(), file);
  const themeJsonPath = getThemeJSONPath(absoluteSrcPath);
  const projectRoot = themeJsonPath
    ? path.dirname(themeJsonPath)
    : path.dirname(getCwd());

  const convertFields = isConvertableFieldJs(
    src,
    file,
    options.commandOptions.convertFields
  );

  if (!isAllowedExtension(file) && !convertFields) {
    debug('watch.skipUnsupportedExtension', { file });
    return;
  }
  if (shouldIgnoreFile(file)) {
    debug('watch.skipIgnoreRule', { file });
    return;
  }

  let fieldsJs: FieldsJs | undefined = undefined;
  if (convertFields) {
    fieldsJs = await new FieldsJs(
      projectRoot,
      absoluteSrcPath,
      undefined,
      options.fieldOptions
    ).init();
    if (fieldsJs.rejected) return;
    // Ensures that the dest path is a .json. The user might pass '.js' accidentally - this ensures it just works.
    dest = convertToUnixPath(path.join(path.dirname(dest), 'fields.json'));
  }
  const fileToUpload =
    convertFields && fieldsJs?.outputPath ? fieldsJs.outputPath : file;

  debug('watch.uploadAttempt', { file, dest });
  const apiOptions = getFileMapperQueryValues(null, options);
  return queue.add(() => {
    return upload(accountId, fileToUpload, dest, apiOptions)
      .then(() => {
        logger('uploadSuccess', { file, dest });
        notifyOfThemePreview(file, accountId, logCallbacks);
      })
      .catch(() => {
        debug('watch.uploadFailed', { file, dest });
        debug('watch.uploadRetry', { file, dest });
        return upload(accountId, file, dest, apiOptions).catch(error => {
          debug('watch.uploadFailed', { file, dest });
          throwApiUploadError(error, {
            accountId,
            request: dest,
            payload: file,
          });
        });
      });
  });
}

async function deleteRemoteFile(
  accountId: number,
  filePath: string,
  remoteFilePath: string,
  logCallbacks: WatchLogCallbacks
): Promise<void> {
  const logger = makeLogger(logCallbacks, 'watch');
  if (shouldIgnoreFile(filePath)) {
    debug('watch.skipIgnoreRule', { file: filePath });
    return;
  }

  debug('watch.deleteAttempt', { remoteFilePath });
  return queue.add(() => {
    return deleteFile(accountId, remoteFilePath)
      .then(() => {
        logger('deleteSuccess', { remoteFilePath });
        notifyOfThemePreview(filePath, accountId, logCallbacks);
      })
      .catch(error => {
        debug('watch.deleteFailed', { remoteFilePath });
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
  commandOptions?: {
    convertFields?: boolean;
  };
  filePaths?: Array<string>;
};

function watch(
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
  logCallbacks: WatchLogCallbacks
) {
  const logger = makeLogger(logCallbacks, 'watch');
  const regex = new RegExp(`^${escapeRegExp(src)}`);
  if (notify) {
    ignoreFile(notify);
  }

  const watcher = chokidar.watch(src, {
    ignoreInitial: true,
    ignored: file => shouldIgnoreFile(file),
  });

  function getDesignManagerPath(file: string): string {
    const relativePath = file.replace(regex, '');
    return convertToUnixPath(path.join(dest, relativePath));
  }

  if (!disableInitial) {
    // Use uploadFolder so that failures of initial upload are retried
    uploadFolder(accountId, src, dest, { mode }, commandOptions, filePaths)
      .then(result => {
        logger.success(
          `Completed uploading files in ${src} to ${dest} in ${accountId}`
        );
        if (postInitialUploadCallback) {
          postInitialUploadCallback(result);
        }
      })
      .catch(error => {
        logger.error(
          `Initial uploading of folder "${src}" to "${dest} in account ${accountId} failed`
        );
        logErrorInstance(error, {
          accountId,
        });
      });
  }

  watcher.on('ready', () => {
    logger.log(
      `Watcher is ready and watching ${src}. Any changes detected will be automatically uploaded and overwrite the current version in the developer file system.`
    );
  });

  watcher.on('add', async filePath => {
    const destPath = getDesignManagerPath(filePath);
    const uploadPromise = uploadFile(accountId, filePath, destPath, {
      src,
      mode,
      commandOptions,
    });
    triggerNotify(notify, 'Added', filePath, uploadPromise);
  });

  if (remove) {
    const deleteFileOrFolder = type => filePath => {
      // If it's a fields.js file that is in a module folder or the root, then ignore because it will not exist on the server.
      if (isConvertableFieldJs(src, filePath, commandOptions.convertFields)) {
        return;
      }

      const remotePath = getDesignManagerPath(filePath);
      if (shouldIgnoreFile(filePath)) {
        logger.debug(`Skipping ${filePath} due to an ignore rule`);
        return;
      }

      logger.debug('Attempting to delete %s "%s"', type, remotePath);
      queue.add(() => {
        const deletePromise = deleteRemoteFile(accountId, filePath, remotePath)
          .then(() => {
            logger.log('Deleted %s "%s"', type, remotePath);
          })
          .catch(error => {
            logger.error('Deleting %s "%s" failed', type, remotePath);
            logApiErrorInstance(
              error,
              new ApiErrorContext({
                accountId,
                request: remotePath,
              })
            );
          });
        triggerNotify(notify, 'Removed', filePath, deletePromise);
        return deletePromise;
      });
    };

    watcher.on('unlink', deleteFileOrFolder('file'));
    watcher.on('unlinkDir', deleteFileOrFolder('folder'));
  }

  watcher.on('change', async filePath => {
    const destPath = getDesignManagerPath(filePath);
    const uploadPromise = uploadFile(accountId, filePath, destPath, {
      src,
      mode,
      commandOptions,
    });
    triggerNotify(notify, 'Changed', filePath, uploadPromise);
  });

  return watcher;
}

module.exports = {
  watch,
};
