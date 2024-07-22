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
import { logger } from './logger';
import { createIgnoreFilter } from './ignoreRules';
import http from '../http';
import { escapeRegExp } from './escapeRegExp';
import {
  getCwd,
  convertToUnixPath,
  convertToLocalFileSystemPath,
} from './path';

import { File, Folder } from '../types/FileManager';
import { i18n } from '../utils/lang';
import { isAuthError, isHubSpotHttpError } from '../errors';
import { FileSystemError } from '../models/FileSystemError';

type SimplifiedFolder = Partial<Folder> & Pick<Folder, 'id' | 'name'>;

const i18nKey = 'lib.fileManager';

export async function uploadFolder(
  accountId: number,
  src: string,
  dest: string
): Promise<void> {
  const regex = new RegExp(`^${escapeRegExp(src)}`);
  const files = await walk(src);

  const filesToUpload = files.filter(createIgnoreFilter(false));

  const len = filesToUpload.length;
  for (let index = 0; index < len; index++) {
    const file = filesToUpload[index];
    const relativePath = file.replace(regex, '');
    const destPath = convertToUnixPath(path.join(dest, relativePath));
    logger.debug(
      i18n(`${i18nKey}.uploadStarted`, {
        file,
        destPath,
        accountId,
      })
    );
    try {
      await uploadFile(accountId, file, destPath);
      logger.log(i18n(`${i18nKey}.uploadSuccess`, { file, destPath }));
    } catch (err) {
      if (isHubSpotHttpError(err)) {
        err.updateContext({
          filepath: file,
          dest: destPath,
        });
        throw err;
      }
      throw new Error(
        i18n(`${i18nKey}.errors.uploadFailed`, {
          file,
          destPath,
        })
      );
    }
  }
}

async function skipExisting(
  overwrite: boolean,
  filepath: string
): Promise<boolean> {
  if (overwrite) {
    return false;
  }
  if (await fs.pathExists(filepath)) {
    logger.log(i18n(`${i18nKey}.skippedExisting`, { filepath }));
    return true;
  }
  return false;
}

async function downloadFile(
  accountId: number,
  file: File,
  dest: string,
  overwrite?: boolean
): Promise<void> {
  const fileName = `${file.name}.${file.extension}`;
  const destPath = convertToLocalFileSystemPath(path.join(dest, fileName));

  if (await skipExisting(overwrite || false, destPath)) {
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
  includeArchived?: boolean
): Promise<void> {
  try {
    await fs.ensureDir(dest);
  } catch (err) {
    throw new FileSystemError(
      { cause: err },
      {
        dest,
        accountId,
        operation: 'write',
      }
    );
  }

  const files = await fetchAllPagedFiles(accountId, folder.id, includeArchived);
  logger.debug(
    i18n(`${i18nKey}.fetchingFiles`, {
      fileCount: files.length,
      folderName: folder.name || '',
    })
  );

  for (const file of files) {
    await downloadFile(accountId, file, dest, overwrite);
  }

  const { objects: folders } = await fetchFolders(accountId, folder.id);
  for (const folder of folders) {
    const nestedFolder = path.join(dest, folder.name);
    await fetchFolderContents(
      accountId,
      folder,
      nestedFolder,
      overwrite,
      includeArchived
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
  includeArchived?: boolean
) {
  let absolutePath: string;

  if (folder.name) {
    absolutePath = convertToLocalFileSystemPath(
      path.resolve(getCwd(), dest, folder.name)
    );
  } else {
    absolutePath = convertToLocalFileSystemPath(path.resolve(getCwd(), dest));
  }

  logger.log(
    i18n(`${i18nKey}.fetchFolderStarted`, {
      src,
      path: absolutePath,
      accountId,
    })
  );

  await fetchFolderContents(
    accountId,
    folder,
    absolutePath,
    overwrite,
    includeArchived
  );
  logger.success(
    i18n(`${i18nKey}.fetchFolderSuccess`, {
      src,
      dest,
    })
  );
}

// Download a single file and write to local file system.
async function downloadSingleFile(
  accountId: number,
  src: string,
  dest: string,
  file: File,
  overwrite?: boolean,
  includeArchived?: boolean
) {
  if (!includeArchived && file.archived) {
    throw new Error(i18n(`${i18nKey}.errors.archivedFile`, { src }));
  }
  if (file.hidden) {
    throw new Error(i18n(`${i18nKey}.errors.hiddenFile`, { src }));
  }

  logger.log(
    i18n(`${i18nKey}.fetchFileStarted`, {
      src,
      dest,
      accountId,
    })
  );
  await downloadFile(accountId, file, dest, overwrite);
  logger.success(
    i18n(`${i18nKey}.fetchFileSuccess`, {
      src,
      dest,
    })
  );
}

// Lookup path in file manager and initiate download
export async function downloadFileOrFolder(
  accountId: number,
  src: string,
  dest: string,
  overwrite?: boolean,
  includeArchived?: boolean
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
        includeArchived
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
          includeArchived
        );
      } else if (folder) {
        await downloadFolder(
          accountId,
          src,
          dest,
          folder,
          overwrite,
          includeArchived
        );
      }
    }
  } catch (err) {
    if (isAuthError(err)) {
      err.updateContext({
        request: src,
        accountId,
      });
    }
    throw err;
  }
}
