import path from 'path';
import chokidar from 'chokidar';
import PQueue from 'p-queue';
import debounce from 'debounce';
import { AxiosError } from 'axios';

import { throwApiError } from '../../errors/apiErrors';
import { isConvertableFieldJs, FieldsJs } from './handleFieldsJS';
import { uploadFolder } from './uploadFolder';
import { shouldIgnoreFile, ignoreFile } from '../ignoreRules';
import { getFileMapperQueryValues } from '../fileMapper';
import { upload, deleteFile } from '../../api/fileMapper';
import { escapeRegExp } from '../escapeRegExp';
import { convertToUnixPath, isAllowedExtension, getCwd } from '../path';
import { triggerNotify } from '../notify';
import { getThemePreviewUrl, getThemeJSONPath } from './themes';
import { logger } from '../logging/logger';
import { FileMapperInputOptions, Mode } from '../../types/Files';
import { UploadFolderResults } from '../../types/Files';
import { i18n } from '../../utils/lang';

const i18nKey = 'lib.cms.watch';

const queue = new PQueue({
  concurrency: 10,
});

function _notifyOfThemePreview(filePath: string, accountId: number): void {
  if (queue.size > 0) return;
  const previewUrl = getThemePreviewUrl(filePath, accountId);
  if (!previewUrl) return;

  logger.log(
    i18n(`${i18nKey}.notifyOfThemePreview`, {
      previewUrl,
    })
  );
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
  mode: Mode | null = null
): Promise<void> {
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
    logger.debug(i18n(`${i18nKey}.skipUnsupportedExtension`, { file }));
    return;
  }
  if (shouldIgnoreFile(file)) {
    logger.debug(i18n(`${i18nKey}.skipIgnoreRule`, { file }));
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

  logger.debug(i18n(`${i18nKey}.uploadAttempt`, { file, dest }));
  const apiOptions = getFileMapperQueryValues(mode, options);
  queue.add(() => {
    return upload(accountId, fileToUpload, dest, apiOptions)
      .then(() => {
        logger.log(i18n(`${i18nKey}.uploadSuccess`, { file, dest }));
        notifyOfThemePreview(file, accountId);
      })
      .catch(() => {
        logger.debug(i18n(`${i18nKey}.uploadFailed`, { file, dest }));
        logger.debug(i18n(`${i18nKey}.uploadRetry`, { file, dest }));
        return upload(accountId, file, dest, apiOptions).catch(
          (error: AxiosError) => {
            logger.debug(
              i18n(`${i18nKey}.uploadFailed`, {
                file,
                dest,
              })
            );
            throwApiError(error, {
              accountId,
              request: dest,
              payload: file,
            });
          }
        );
      });
  });
}

async function deleteRemoteFile(
  accountId: number,
  filePath: string,
  remoteFilePath: string
): Promise<void> {
  if (shouldIgnoreFile(filePath)) {
    logger.debug(i18n(`${i18nKey}.skipIgnoreRule`, { file: filePath }));
    return;
  }

  logger.debug(i18n(`${i18nKey}.deleteAttempt`, { remoteFilePath }));
  return queue.add(() => {
    return deleteFile(accountId, remoteFilePath)
      .then(() => {
        logger.log(i18n(`${i18nKey}.deleteSuccess`, { remoteFilePath }));
        notifyOfThemePreview(filePath, accountId);
      })
      .catch((error: AxiosError) => {
        logger.debug(
          i18n(`${i18nKey}.deleteFailed`, {
            remoteFilePath,
          })
        );
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

type ErrorHandler = (error: AxiosError) => void;

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
  onQueueAddError?: ErrorHandler
) {
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
      logger.log(
        i18n(`${i18nKey}.folderUploadSuccess`, {
          src,
          dest,
          accountId,
        })
      );
      if (postInitialUploadCallback) {
        postInitialUploadCallback(result);
      }
    });

    if (onUploadFolderError) {
      uploadFolderPromise.catch(onUploadFolderError);
    }
  }

  watcher.on('ready', () => {
    logger.log(i18n(`${i18nKey}.ready`, { src }));
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
      mode
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
          logger.debug(i18n(`${i18nKey}.skipIgnoreRule`, { file: filePath }));
          return;
        }

        logger.debug(
          i18n(`${i18nKey}.deleteAttemptWithType`, {
            type,
            remoteFilePath: remotePath,
          })
        );
        const queueAddPromise = queue.add(() => {
          const deletePromise = deleteRemoteFile(
            accountId,
            filePath,
            remotePath
          ).then(() => {
            logger.log(
              i18n(`${i18nKey}.deleteSuccessWithType`, {
                type,
                remoteFilePath: remotePath,
              })
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
      mode
    );
    triggerNotify(notify, 'Changed', filePath, uploadPromise);
  });

  return watcher;
}
