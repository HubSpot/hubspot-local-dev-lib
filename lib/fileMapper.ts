// FILE MAPPER - not to be confused with fileManager.ts

import fs from 'fs-extra';
import path from 'path';
import PQueue from 'p-queue';
import { AxiosError } from 'axios';
import {
  getCwd,
  getExt,
  convertToLocalFileSystemPath,
  isAllowedExtension,
} from './path';
import { fetchFileStream, download, downloadDefault } from '../api/fileMapper';
import {
  throwError,
  throwErrorWithMessage,
  throwTypeErrorWithMessage,
} from '../errors/standardErrors';
import { MODULE_EXTENSION, FUNCTIONS_EXTENSION } from '../constants/extensions';
import { MODE } from '../constants/files';
import {
  FileMapperNode,
  Mode,
  FileMapperOptions,
  FileMapperInputOptions,
} from '../types/Files';
import { throwFileSystemError } from '../errors/fileSystemErrors';
import { BaseError } from '../types/Error';
import { LogCallbacksArg } from '../types/LogCallbacks';
import { makeTypedLogger } from '../utils/logger';

const i18nKey = 'lib.fileMapper';

const queue = new PQueue({
  concurrency: 10,
});

export function isPathToFile(filepath: string): boolean {
  const ext = getExt(filepath);
  return !!ext && ext !== MODULE_EXTENSION && ext !== FUNCTIONS_EXTENSION;
}

export function isPathToModule(filepath: string): boolean {
  const ext = getExt(filepath);
  return ext === MODULE_EXTENSION;
}

export function isPathToRoot(filepath: string): boolean {
  if (typeof filepath !== 'string') return false;
  // Root pattern matches empty strings and: / \
  return /^(\/|\\)?$/.test(filepath.trim());
}

export function isPathToHubspot(filepath: string): boolean {
  if (typeof filepath !== 'string') return false;
  return /^(\/|\\)?@hubspot/i.test(filepath.trim());
}

function useApiBuffer(mode?: Mode | null): boolean {
  return mode === MODE.draft;
}

// Determines API param based on mode an options
export function getFileMapperQueryValues(
  mode?: Mode | null,
  { staging, assetVersion }: FileMapperInputOptions = {}
): FileMapperOptions {
  return {
    params: {
      buffer: useApiBuffer(mode),
      environmentId: staging ? 2 : 1,
      version: assetVersion,
    },
  };
}

// Determines version number to log based on input.options
function getAssetVersionIdentifier(
  assetVersion?: string,
  src?: string
): string {
  if (
    typeof assetVersion !== 'undefined' &&
    typeof src !== 'undefined' &&
    src.startsWith('@hubspot/')
  ) {
    return ` v${assetVersion}`;
  }
  return '';
}

function validateFileMapperNode(node: FileMapperNode): void {
  if (node === Object(node)) return;
  let json;
  try {
    json = JSON.stringify(node, null, 2);
  } catch (err) {
    json = node;
  }
  throwTypeErrorWithMessage(`${i18nKey}.errors.invalidNode`, {
    json: JSON.stringify(json),
  });
}

type PathTypeData = {
  isModule: boolean;
  isHubspot: boolean;
  isFile: boolean;
  isRoot: boolean;
  isFolder: boolean;
};

export function getTypeDataFromPath(src: string): PathTypeData {
  const isModule = isPathToModule(src);
  const isHubspot = isPathToHubspot(src);
  const isFile = !isModule && isPathToFile(src);
  const isRoot = !isModule && !isFile && isPathToRoot(src);
  const isFolder = !isFile;
  return {
    isModule,
    isHubspot,
    isFile,
    isRoot,
    isFolder,
  };
}

type RecursiveFileMapperCallback = (
  node: FileMapperNode,
  filepath?: string,
  depth?: number
) => boolean;

export function recurseFolder(
  node: FileMapperNode,
  callback: RecursiveFileMapperCallback,
  filepath = '',
  depth = 0
): boolean {
  validateFileMapperNode(node);
  const isRootFolder = node.folder && depth === 0;
  if (isRootFolder) {
    if (!filepath) {
      filepath = node.name;
    }
  } else {
    filepath = path.join(filepath, node.name);
  }
  let __break = callback(node, filepath, depth);
  if (__break === false) return __break;
  __break = node.children.every(childNode => {
    __break = recurseFolder(childNode, callback, filepath, depth + 1);
    return __break !== false;
  });
  return depth === 0 ? false : __break;
}

export async function writeUtimes(
  accountId: number,
  filepath: string,
  node: FileMapperNode
): Promise<void> {
  try {
    const now = new Date();
    const atime = node.createdAt ? new Date(node.createdAt) : now;
    const mtime = node.updatedAt ? new Date(node.updatedAt) : now;
    await fs.utimes(filepath, atime, mtime);
  } catch (err) {
    throwFileSystemError(err as BaseError, {
      filepath,
      accountId,
      write: true,
    });
  }
}

async function skipExisting(
  filepath: string,
  overwrite = false
): Promise<boolean> {
  if (overwrite) {
    return false;
  }
  if (await fs.pathExists(filepath)) {
    return true;
  }
  return false;
}

const filemapperCallbackKeys = ['skippedExisting', 'wroteFolder'];

async function fetchAndWriteFileStream(
  accountId: number,
  srcPath: string,
  filepath: string,
  mode?: Mode,
  options: FileMapperInputOptions = {},
  logCallbacks?: LogCallbacksArg<typeof filemapperCallbackKeys>
): Promise<void> {
  const logger = makeTypedLogger<typeof filemapperCallbackKeys>(logCallbacks);
  if (typeof srcPath !== 'string' || !srcPath.trim()) {
    return;
  }
  if (await skipExisting(filepath, options.overwrite)) {
    logger('skippedExisting', `${i18nKey}.skippedExisting`, { filepath });
    return;
  }
  if (!isAllowedExtension(srcPath)) {
    throwErrorWithMessage(`${i18nKey}.errors.invalidFileType`, { srcPath });
  }
  let node: FileMapperNode;
  try {
    node = await fetchFileStream(
      accountId,
      srcPath,
      filepath,
      getFileMapperQueryValues(mode, options)
    );
  } catch (err) {
    throwError(err as BaseError);
  }
  await writeUtimes(accountId, filepath, node);
}

// Writes an individual file or folder (not recursive).  If file source is missing, the
//file is fetched.
async function writeFileMapperNode(
  accountId: number,
  filepath: string,
  node: FileMapperNode,
  mode?: Mode,
  options: FileMapperInputOptions = {},
  logCallbacks?: LogCallbacksArg<typeof filemapperCallbackKeys>
): Promise<boolean> {
  const logger = makeTypedLogger<typeof filemapperCallbackKeys>(logCallbacks);
  const localFilepath = convertToLocalFileSystemPath(path.resolve(filepath));
  if (await skipExisting(localFilepath, options.overwrite)) {
    logger('skippedExisting', `${i18nKey}.skippedExisting`, {
      filepath: localFilepath,
    });
    return true;
  }
  if (!node.folder) {
    try {
      await fetchAndWriteFileStream(
        accountId,
        node.path,
        localFilepath,
        mode,
        options,
        logCallbacks
      );
      return true;
    } catch (err) {
      return false;
    }
  }
  try {
    await fs.ensureDir(localFilepath);
    logger('wroteFolder', `${i18nKey}.wroteFolder`, {
      filepath: localFilepath,
    });
  } catch (err) {
    throwFileSystemError(err as BaseError, {
      filepath: localFilepath,
      accountId,
      write: true,
    });
    return false;
  }
  return true;
}

function isTimeout(err: BaseError): boolean {
  return !!err && (err.status === 408 || err.code === 'ESOCKETTIMEDOUT');
}

async function downloadFile(
  accountId: number,
  src: string,
  destPath: string,
  mode?: Mode,
  options: FileMapperInputOptions = {},
  logCallbacks?: LogCallbacksArg<typeof filemapperCallbackKeys>
): Promise<void> {
  const logger = makeTypedLogger<typeof filemapperCallbackKeys>(logCallbacks);
  const { isFile, isHubspot } = getTypeDataFromPath(src);
  try {
    if (!isFile) {
      throwErrorWithMessage(`${i18nKey}.errors.invalidRequest`, { src });
    }
    const dest = path.resolve(destPath);
    const cwd = getCwd();
    let filepath: string;
    if (dest === cwd) {
      // Dest: CWD
      filepath = path.resolve(cwd, path.basename(src));
    } else if (isPathToFile(dest)) {
      // Dest: file path
      filepath = path.isAbsolute(dest) ? dest : path.resolve(cwd, dest);
    } else {
      // Dest: folder path
      const name = path.basename(src);
      filepath = path.isAbsolute(dest)
        ? path.resolve(dest, name)
        : path.resolve(cwd, dest, name);
    }
    const localFsPath = convertToLocalFileSystemPath(filepath);
    await fetchAndWriteFileStream(
      accountId,
      src,
      localFsPath,
      mode,
      options,
      logCallbacks
    );
    await queue.onIdle();
    logger('completedFetch', `${i18nKey}.completedFetch`, {
      src,
      version: getAssetVersionIdentifier(options.assetVersion, src),
      dest,
    });
  } catch (err) {
    const error = err as AxiosError;
    if (isHubspot && isTimeout(error)) {
      throwErrorWithMessage(`${i18nKey}.errors.assetTimeout`, {}, error);
    } else {
      throwErrorWithMessage(
        `${i18nKey}.errors.failedToFetchFile`,
        { src, dest: destPath },
        error
      );
    }
  }
}

export async function fetchFolderFromApi(
  accountId: number,
  src: string,
  mode?: Mode,
  options: FileMapperInputOptions = {},
  logCallbacks?: LogCallbacksArg<typeof filemapperCallbackKeys>
): Promise<FileMapperNode> {
  const logger = makeTypedLogger<typeof filemapperCallbackKeys>(logCallbacks);
  const { isRoot, isFolder, isHubspot } = getTypeDataFromPath(src);
  if (!isFolder) {
    throwErrorWithMessage(`${i18nKey}.errors.invalidFetchFolderRequest`, {
      src,
    });
  }
  try {
    const srcPath = isRoot ? '@root' : src;
    const queryValues = getFileMapperQueryValues(mode, options);
    const node = isHubspot
      ? await downloadDefault(accountId, srcPath, queryValues)
      : await download(accountId, srcPath, queryValues);
    logger('folderFetch', `${i18nKey}.folderFetch`, { src, accountId });
    return node;
  } catch (err) {
    const error = err as BaseError;
    if (isHubspot && isTimeout(error)) {
      throwErrorWithMessage(`${i18nKey}.errors.assetTimeout`, {}, error);
    } else {
      throwError(error);
    }
  }
}

async function downloadFolder(
  accountId: number,
  src: string,
  destPath: string,
  mode?: Mode,
  options: FileMapperInputOptions = {},
  logCallbacks?: LogCallbacksArg<typeof filemapperCallbackKeys>
) {
  const logger = makeTypedLogger<typeof filemapperCallbackKeys>(logCallbacks);
  try {
    const node = await fetchFolderFromApi(
      accountId,
      src,
      mode,
      options,
      logCallbacks
    );
    if (!node) {
      return;
    }
    const dest = path.resolve(destPath);
    const rootPath =
      dest === getCwd()
        ? convertToLocalFileSystemPath(path.resolve(dest, node.name))
        : dest;
    let success = true;
    recurseFolder(
      node,
      (childNode, filepath) => {
        queue.add(async () => {
          const succeeded = await writeFileMapperNode(
            accountId,
            filepath || '',
            childNode,
            mode,
            options,
            logCallbacks
          );
          if (succeeded === false) {
            success = false;
          }
        });
        return success;
      },
      rootPath
    );
    await queue.onIdle();

    if (success) {
      logger('completedFolderFetch', `${i18nKey}.completedFolderFetch`, {
        src,
        version: getAssetVersionIdentifier(options.assetVersion, src),
        dest,
      });
    } else {
      throwErrorWithMessage(`${i18nKey}.errors.incompleteFetch`, { src });
    }
  } catch (err) {
    throwErrorWithMessage(
      `${i18nKey}.errors.failedToFetchFolder`,
      { src, dest: destPath },
      err as AxiosError
    );
  }
}

/**
 * Fetch a file/folder and write to local file system.
 *
 * @async
 * @param {FileMapperInputArguments} input
 * @returns {Promise}
 */
export async function downloadFileOrFolder(
  accountId: number,
  src: string,
  dest: string,
  mode?: Mode,
  options: FileMapperInputOptions = {},
  logCallbacks?: LogCallbacksArg<typeof filemapperCallbackKeys>
): Promise<void> {
  if (!src) {
    return;
  }
  const { isFile } = getTypeDataFromPath(src);
  if (isFile) {
    await downloadFile(accountId, src, dest, mode, options, logCallbacks);
  } else {
    await downloadFolder(accountId, src, dest, mode, options, logCallbacks);
  }
}
