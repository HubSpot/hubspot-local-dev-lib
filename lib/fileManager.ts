// FILE MANAGER - not to be confused with fileMapper.ts

import fs from 'fs-extra';
import path from 'path';

import {
  uploadFile,
  fetchStat,
  fetchFiles,
  fetchFolders,
} from '../api/fileManager';
import { walk } from './fs';
import { debug } from '../utils/logger';
import { createIgnoreFilter } from './ignoreRules';
import http from '../http';
import { escapeRegExp } from '../utils/escapeRegExp';
import {
  getCwd,
  convertToUnixPath,
  convertToLocalFileSystemPath,
} from './path';

import { throwApiError, throwApiUploadError } from '../errors/apiErrors';
import {
  isFatalError,
  throwErrorWithMessage,
  throwError,
} from '../errors/standardErrors';
import { throwFileSystemError } from '../errors/fileSystemErrors';
import { LogCallbacksArg } from '../types/LogCallbacks';
import { makeTypedLogger } from '../utils/logger';
import { BaseError } from '../types/Error';
import { File, Folder } from '../types/FileManager';

const i18nKey = 'lib.fileManager';

const uploadFolderCallbackKeys = ['uploadSuccess'];

async function uploadFolder(
  accountId: number,
  src: string,
  dest: string,
  logCallbacks?: LogCallbacksArg<typeof uploadFolderCallbackKeys>
): Promise<void> {
  const logger = makeTypedLogger<typeof uploadFolderCallbackKeys>(logCallbacks);
  const regex = new RegExp(`^${escapeRegExp(src)}`);
  const files = await walk(src);

  const filesToUpload = files.filter(createIgnoreFilter(false));

  const len = filesToUpload.length;
  for (let index = 0; index < len; index++) {
    const file = filesToUpload[index];
    const relativePath = file.replace(regex, '');
    const destPath = convertToUnixPath(path.join(dest, relativePath));
    debug(`${i18nKey}.uploadStarted`, {
      file,
      destPath,
      accountId,
    });
    try {
      await uploadFile(accountId, file, destPath);
      logger('uploadSuccess', `${i18nKey}.uploadSuccess`, { file, destPath });
    } catch (err) {
      const error = err as BaseError;
      if (isFatalError(error)) {
        throwError(error);
      }
      throwErrorWithMessage(`${i18nKey}.errors.uploadFailed`, {
        file,
        destPath,
      });
    }
  }
}

const downloadFileCallbackKeys = ['skippedExisting'];

async function skipExisting(
  overwrite: boolean,
  filepath: string,
  logCallbacks?: LogCallbacksArg<typeof downloadFileCallbackKeys>
): Promise<boolean> {
  const logger = makeTypedLogger<typeof downloadFileCallbackKeys>(logCallbacks);
  if (overwrite) {
    return false;
  }
  if (await fs.pathExists(filepath)) {
    logger('skippedExisting', `${i18nKey}.skippedExisting`, { filepath });
    return true;
  }
  return false;
}

async function downloadFile(
  accountId: number,
  file: File,
  dest: string,
  overwrite?: boolean,
  logCallbacks?: LogCallbacksArg<typeof downloadFileCallbackKeys>
): Promise<void> {
  const fileName = `${file.name}.${file.extension}`;
  const destPath = convertToLocalFileSystemPath(path.join(dest, fileName));

  if (await skipExisting(overwrite || false, destPath, logCallbacks)) {
    return;
  }
  try {
    await http.getOctetStream(
      accountId,
      {
        baseURL: file.url,
        url: '',
      },
      destPath
    );
  } catch (err) {
    throwError(err as BaseError);
  }
}

async function fetchAllPagedFiles(
  accountId: number,
  folderId: string,
  includeArchived?: boolean
): Promise<Array<File | Folder>> {
  let totalFiles: number | null = null;
  let files: Array<File | Folder> = [];
  let count = 0;
  let offset = 0;
  while (totalFiles === null || count < totalFiles) {
    const response = await fetchFiles(
      accountId,
      folderId,
      offset,
      includeArchived
    );

    if (totalFiles === null) {
      totalFiles = response.total_count;
    }

    count += response.objects.length;
    offset += response.objects.length;
    files = files.concat(response.objects);
  }
  return files;
}

/**
 *
 * @param {number} accountId
 * @param {object} folder
 * @param {string} dest
 * @param {object} options
 */
async function fetchFolderContents(accountId, folder, dest, options) {
  try {
    await fs.ensureDir(dest);
  } catch (err) {
    logFileSystemErrorInstance(
      err,
      new FileSystemErrorContext({
        dest,
        accountId,
        write: true,
      })
    );
  }

  const files = await fetchAllPagedFiles(accountId, folder.id, options);
  logger.debug(
    `Fetching ${files.length} files from remote folder: ${folder.name}`
  );
  for (const file of files) {
    await downloadFile(accountId, file, dest, options);
  }

  const { objects: folders } = await fetchFolders(accountId, folder.id);
  for (const folder of folders) {
    const nestedFolder = path.join(dest, folder.name);
    await fetchFolderContents(accountId, folder, nestedFolder, options);
  }
}

/**
 * Download a folder and write to local file system.
 *
 * @param {number} accountId
 * @param {string} src
 * @param {string} dest
 * @param {object} folder
 * @param {object} options
 */
async function downloadFolder(accountId, src, dest, folder, options) {
  try {
    let absolutePath;

    if (folder.name) {
      absolutePath = convertToLocalFileSystemPath(
        path.resolve(getCwd(), dest, folder.name)
      );
    } else {
      absolutePath = convertToLocalFileSystemPath(path.resolve(getCwd(), dest));
    }

    logger.log(
      'Fetching folder from "%s" to "%s" in the File Manager of account %s',
      src,
      absolutePath,
      accountId
    );
    await fetchFolderContents(accountId, folder, absolutePath, options);
    logger.success(
      'Completed fetch of folder "%s" to "%s" from the File Manager',
      src,
      dest
    );
  } catch (err) {
    logErrorInstance(err);
  }
}

/**
 * Download a single file and write to local file system.
 *
 * @param {number} accountId
 * @param {string} src
 * @param {string} dest
 * @param {object} file
 * @param {object} options
 */
async function downloadSingleFile(accountId, src, dest, file, options) {
  if (!options.includeArchived && file.archived) {
    logger.error(
      '"%s" in the File Manager is an archived file. Try fetching again with the "--include-archived" flag.',
      src
    );
    return;
  }
  if (file.hidden) {
    logger.error('"%s" in the File Manager is a hidden file.', src);
    return;
  }

  try {
    logger.log(
      'Fetching file from "%s" to "%s" in the File Manager of account %s',
      src,
      dest,
      accountId
    );
    await downloadFile(accountId, file, dest, options);
    logger.success(
      'Completed fetch of file "%s" to "%s" from the File Manager',
      src,
      dest
    );
  } catch (err) {
    logErrorInstance(err);
  }
}

/**
 * Lookup path in file manager and initiate download
 *
 * @param {number} accountId
 * @param {string} src
 * @param {string} dest
 * @param {object} options
 */
async function downloadFileOrFolder(accountId, src, dest, options) {
  try {
    if (src == '/') {
      // Filemanager API treats 'None' as the root
      const rootFolder = { id: 'None' };
      await downloadFolder(accountId, src, dest, rootFolder, options);
    } else {
      const { file, folder } = await fetchStat(accountId, src);
      if (file) {
        await downloadSingleFile(accountId, src, dest, file, options);
      } else if (folder) {
        await downloadFolder(accountId, src, dest, folder, options);
      }
    }
  } catch (err) {
    logApiErrorInstance(
      err,
      new ApiErrorContext({
        request: src,
        accountId,
      })
    );
  }
}

module.exports = {
  uploadFolder,
  downloadFileOrFolder,
};
