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
import { debug, makeTypedLogger } from '../utils/logger';
import { createIgnoreFilter } from './ignoreRules';
import http from '../http';
import { escapeRegExp } from '../utils/escapeRegExp';
import {
  getCwd,
  convertToUnixPath,
  convertToLocalFileSystemPath,
} from './path';

import { throwApiError } from '../errors/apiErrors';
import {
  isFatalError,
  throwErrorWithMessage,
  throwError,
} from '../errors/standardErrors';
import { throwFileSystemError } from '../errors/fileSystemErrors';
import { LogCallbacksArg } from '../types/LogCallbacks';
import { BaseError, GenericError } from '../types/Error';
import { File, Folder } from '../types/FileManager';
import { AxiosError } from 'axios';

type SimplifiedFolder = Partial<Folder> & Pick<Folder, 'id' | 'name'>;

const i18nKey = 'lib.fileManager';

const uploadCallbackKeys = ['uploadSuccess'];
const downloadCallbackKeys = [
  'skippedExisting',
  'fetchFolderStarted',
  'fetchFolderSuccess',
  'fetchFileStarted',
  'fetchFileSuccess',
];

export async function uploadFolder(
  accountId: number,
  src: string,
  dest: string,
  logCallbacks?: LogCallbacksArg<typeof uploadCallbackKeys>
): Promise<void> {
  const logger = makeTypedLogger<typeof uploadCallbackKeys>(logCallbacks);
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

async function skipExisting(
  overwrite: boolean,
  filepath: string,
  logCallbacks?: LogCallbacksArg<typeof downloadCallbackKeys>
): Promise<boolean> {
  const logger = makeTypedLogger<typeof downloadCallbackKeys>(logCallbacks);
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
  logCallbacks?: LogCallbacksArg<typeof downloadCallbackKeys>
): Promise<void> {
  const fileName = `${file.name}.${file.extension}`;
  const destPath = convertToLocalFileSystemPath(path.join(dest, fileName));

  if (await skipExisting(overwrite || false, destPath, logCallbacks)) {
    return;
  }
  await http.getOctetStream(
    accountId,
    {
      baseURL: file.url,
      url: '',
    },
    destPath
  );
}

async function fetchAllPagedFiles(
  accountId: number,
  folderId: number | 'None',
  includeArchived?: boolean
): Promise<Array<File>> {
  let totalFiles: number | null = null;
  let files: Array<File> = [];
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

async function fetchFolderContents(
  accountId: number,
  folder: SimplifiedFolder,
  dest: string,
  overwrite?: boolean,
  includeArchived?: boolean,
  logCallbacks?: LogCallbacksArg<typeof downloadCallbackKeys>
): Promise<void> {
  try {
    await fs.ensureDir(dest);
  } catch (err) {
    throwFileSystemError(err as BaseError, {
      dest,
      accountId,
      write: true,
    });
  }

  const files = await fetchAllPagedFiles(accountId, folder.id, includeArchived);
  debug(`${i18nKey}.fetchingFiles`, {
    fileCount: files.length,
    folderName: folder.name || '',
  });

  for (const file of files) {
    await downloadFile(accountId, file, dest, overwrite, logCallbacks);
  }

  const { objects: folders } = await fetchFolders(accountId, folder.id);
  for (const folder of folders) {
    const nestedFolder = path.join(dest, folder.name);
    await fetchFolderContents(
      accountId,
      folder,
      nestedFolder,
      overwrite,
      includeArchived,
      logCallbacks
    );
  }
}

// Download a folder and write to local file system.
async function downloadFolder(
  accountId: number,
  src: string,
  dest: string,
  folder: SimplifiedFolder,
  overwrite?: boolean,
  includeArchived?: boolean,
  logCallbacks?: LogCallbacksArg<typeof downloadCallbackKeys>
) {
  const logger = makeTypedLogger<typeof downloadCallbackKeys>(logCallbacks);
  let absolutePath: string;

  if (folder.name) {
    absolutePath = convertToLocalFileSystemPath(
      path.resolve(getCwd(), dest, folder.name)
    );
  } else {
    absolutePath = convertToLocalFileSystemPath(path.resolve(getCwd(), dest));
  }

  logger('fetchFolderStarted', `${i18nKey}.fetchFolderStarted`, {
    src,
    path: absolutePath,
    accountId,
  });

  await fetchFolderContents(
    accountId,
    folder,
    absolutePath,
    overwrite,
    includeArchived,
    logCallbacks
  );
  logger('fetchFolderSuccess', `${i18nKey}.fetchFolderSuccess`, {
    src,
    dest,
  });
}

// Download a single file and write to local file system.
async function downloadSingleFile(
  accountId: number,
  src: string,
  dest: string,
  file: File,
  overwrite?: boolean,
  includeArchived?: boolean,
  logCallbacks?: LogCallbacksArg<typeof downloadCallbackKeys>
) {
  const logger = makeTypedLogger<typeof downloadCallbackKeys>(logCallbacks);
  if (!includeArchived && file.archived) {
    throwErrorWithMessage(`${i18nKey}.errors.archivedFile`, { src });
  }
  if (file.hidden) {
    throwErrorWithMessage(`${i18nKey}.errors.hiddenFile`, { src });
  }

  logger('fetchFileStarted', `${i18nKey}.fetchFileStarted`, {
    src,
    dest,
    accountId,
  });
  await downloadFile(accountId, file, dest, overwrite, logCallbacks);
  logger('fetchFileSuccess', `${i18nKey}.fetchFileSuccess`, {
    src,
    dest,
  });
}

// Lookup path in file manager and initiate download
export async function downloadFileOrFolder(
  accountId: number,
  src: string,
  dest: string,
  overwrite?: boolean,
  includeArchived?: boolean,
  logCallbacks?: LogCallbacksArg<typeof downloadCallbackKeys>
) {
  try {
    if (src == '/') {
      // Filemanager API treats 'None' as the root
      const rootFolder = { id: 'None', name: '' } as const;
      await downloadFolder(
        accountId,
        src,
        dest,
        rootFolder,
        overwrite,
        includeArchived,
        logCallbacks
      );
    } else {
      const { file, folder } = await fetchStat(accountId, src);
      if (file) {
        await downloadSingleFile(
          accountId,
          src,
          dest,
          file,
          overwrite,
          includeArchived,
          logCallbacks
        );
      } else if (folder) {
        await downloadFolder(
          accountId,
          src,
          dest,
          folder,
          overwrite,
          includeArchived,
          logCallbacks
        );
      }
    }
  } catch (err) {
    const error = err as GenericError;
    if (error.isAxiosError) {
      throwApiError(err as AxiosError, {
        request: src,
        accountId,
      });
    } else throwError(error);
  }
}
