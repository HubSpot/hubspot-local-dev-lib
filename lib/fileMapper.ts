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
} from './path.js';
import { logger } from './logger.js';
import {
  fetchFileStream,
  download,
  downloadDefault,
  getDirectoryMetaByPath,
} from '../api/fileMapper.js';
import {
  MODULE_EXTENSION,
  FUNCTIONS_EXTENSION,
  JSR_ALLOWED_EXTENSIONS,
} from '../constants/extensions.js';
import { CMS_PUBLISH_MODE } from '../constants/files.js';
import {
  FileMapperNode,
  DirectoryMetaNode,
  CmsPublishMode,
  FileMapperOptions,
  FileMapperInputOptions,
  PathTypeData,
  RecursiveFileMapperCallback,
} from '../types/Files.js';
import { isTimeoutError } from '../errors/index.js';
import { i18n } from '../utils/lang.js';
import { FileSystemError } from '../models/FileSystemError.js';

const i18nKey = 'lib.fileMapper';

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

export function isPathToFolder(filepath: string): boolean {
  return !isPathToFile(filepath);
}

export function isPathToHubspot(filepath: string): boolean {
  if (typeof filepath !== 'string') return false;
  return /^(\/|\\)?@hubspot/i.test(filepath.trim());
}

function useApiBuffer(cmsPublishMode?: CmsPublishMode | null): boolean {
  return cmsPublishMode === CMS_PUBLISH_MODE.draft;
}

// Determines API param based on publish mode and options
export function getFileMapperQueryValues(
  cmsPublishMode?: CmsPublishMode | null,
  { staging, assetVersion, timeout }: FileMapperInputOptions = {}
): FileMapperOptions {
  return {
    params: {
      buffer: useApiBuffer(cmsPublishMode),
      environmentId: staging ? 2 : 1,
      version: assetVersion,
    },
    ...(timeout !== undefined && { timeout }),
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
  throw new Error(
    i18n(`${i18nKey}.errors.invalidNode`, {
      json: JSON.stringify(json),
    })
  );
}

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
    throw new FileSystemError(
      { cause: err },
      {
        filepath,
        accountId,
        operation: 'write',
      }
    );
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

async function fetchAndWriteFileStream(
  accountId: number,
  srcPath: string,
  filepath: string,
  cmsPublishMode?: CmsPublishMode,
  options: FileMapperInputOptions = {}
): Promise<void> {
  if (typeof srcPath !== 'string' || !srcPath.trim()) {
    return;
  }
  if (await skipExisting(filepath, options.overwrite)) {
    logger.log(i18n(`${i18nKey}.skippedExisting`, { filepath }));
    return;
  }
  if (!isAllowedExtension(srcPath, Array.from(JSR_ALLOWED_EXTENSIONS))) {
    throw new Error(i18n(`${i18nKey}.errors.invalidFileType`, { srcPath }));
  }
  const node = await fetchFileStream(
    accountId,
    srcPath,
    filepath,
    getFileMapperQueryValues(cmsPublishMode, options)
  );
  await writeUtimes(accountId, filepath, node);
}

async function downloadFile(
  accountId: number,
  src: string,
  destPath: string,
  cmsPublishMode?: CmsPublishMode,
  options: FileMapperInputOptions = {}
): Promise<void> {
  const { isFile, isHubspot } = getTypeDataFromPath(src);

  if (!isFile) {
    throw new Error(i18n(`${i18nKey}.errors.invalidRequest`, { src }));
  }

  try {
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
      cmsPublishMode,
      options
    );
    logger.success(
      i18n(`${i18nKey}.completedFetch`, {
        src,
        version: getAssetVersionIdentifier(options.assetVersion, src),
        dest,
      })
    );
  } catch (err) {
    const error = err as AxiosError;
    if (isHubspot && isTimeoutError(error)) {
      throw new Error(i18n(`${i18nKey}.errors.assetTimeout`), { cause: error });
    } else {
      throw new Error(
        i18n(`${i18nKey}.errors.failedToFetchFile`, { src, dest: destPath }),
        { cause: error }
      );
    }
  }
}

/**
 * @deprecated Use downloadFileOrFolder instead. This function fetches the
 * entire directory tree in a single request, which times out for large
 * directories.
 */
export async function fetchFolderFromApi(
  accountId: number,
  src: string,
  cmsPublishMode?: CmsPublishMode,
  options: FileMapperInputOptions = {}
): Promise<FileMapperNode> {
  const { isRoot, isFolder, isHubspot } = getTypeDataFromPath(src);
  if (!isFolder) {
    throw new Error(
      i18n(`${i18nKey}.errors.invalidFetchFolderRequest`, {
        src,
      })
    );
  }
  const srcPath = isRoot ? '@root' : src;
  const queryValues = getFileMapperQueryValues(cmsPublishMode, options);
  const { data: node } = isHubspot
    ? await downloadDefault(accountId, srcPath, queryValues)
    : await download(accountId, srcPath, queryValues);
  logger.log(i18n(`${i18nKey}.folderFetch`, { src, accountId }));
  return node;
}

type QueueFolderTreeContext = {
  cmsPublishMode: CmsPublishMode | undefined;
  options: FileMapperInputOptions;
  failedPaths: Set<string>;
  queue: PQueue;
};

async function queueFolderTree(
  accountId: number,
  src: string,
  localPath: string,
  directoryNode: DirectoryMetaNode,
  ctx: QueueFolderTreeContext
): Promise<void> {
  const { cmsPublishMode, options, failedPaths, queue } = ctx;
  if (!directoryNode.folder) return;

  const { isRoot } = getTypeDataFromPath(src);
  let children: string[] = directoryNode.children || [];
  if (isRoot) {
    children = ['@hubspot', ...children];
  }

  try {
    await fs.ensureDir(localPath);
  } catch (err) {
    throw new FileSystemError(
      { cause: err },
      { filepath: localPath, accountId, operation: 'write' }
    );
  }
  logger.log(i18n(`${i18nKey}.wroteFolder`, { filepath: localPath }));

  const queryValues = getFileMapperQueryValues(cmsPublishMode, options);

  const queueFileDownload = (remotePath: string, destPath: string) => {
    queue.add(async () => {
      try {
        await fetchAndWriteFileStream(
          accountId,
          remotePath,
          destPath,
          cmsPublishMode,
          options
        );
      } catch (err) {
        failedPaths.add(remotePath);
        logger.debug(
          i18n(`${i18nKey}.errors.failedToFetchFile`, {
            src: remotePath,
            dest: destPath,
          })
        );
      }
    });
  };

  for (const childName of children) {
    const childRemotePath = isRoot ? childName : `${src}/${childName}`;
    const childLocalPath = convertToLocalFileSystemPath(
      path.join(localPath, childName)
    );

    if (isAllowedExtension(childRemotePath, [...JSR_ALLOWED_EXTENSIONS])) {
      queueFileDownload(childRemotePath, childLocalPath);
    } else {
      const { data: childNode } = await getDirectoryMetaByPath(
        accountId,
        childRemotePath,
        queryValues
      );
      if (childNode) {
        if (childNode.folder) {
          await queueFolderTree(
            accountId,
            childRemotePath,
            childLocalPath,
            childNode,
            ctx
          );
        } else {
          queueFileDownload(childRemotePath, childLocalPath);
        }
      }
    }
  }
}

async function downloadFolder(
  accountId: number,
  src: string,
  destPath: string,
  cmsPublishMode?: CmsPublishMode,
  options: FileMapperInputOptions = {}
) {
  src = src.length > 1 ? src.replace(/\/+$/, '') : src;
  const dest = path.resolve(destPath);
  const { isRoot } = getTypeDataFromPath(src);
  const metaPath = isRoot ? '/' : src;
  const queryValues = getFileMapperQueryValues(cmsPublishMode, options);
  const failedPaths = new Set<string>();
  const queue = new PQueue({ concurrency: 10 });

  try {
    const { data: rootMeta } = await getDirectoryMetaByPath(
      accountId,
      metaPath,
      queryValues
    );

    if (!rootMeta) return;

    logger.log(i18n(`${i18nKey}.folderFetch`, { src, accountId }));

    const rootPath =
      dest === getCwd()
        ? convertToLocalFileSystemPath(
            path.resolve(dest, rootMeta.name || path.basename(src))
          )
        : dest;

    await queueFolderTree(accountId, src, rootPath, rootMeta, {
      cmsPublishMode,
      options,
      failedPaths,
      queue,
    });
    await queue.onIdle();
  } catch (err) {
    queue.clear();
    const error = err as AxiosError;
    if (isTimeoutError(error)) {
      throw new Error(i18n(`${i18nKey}.errors.assetTimeout`), { cause: error });
    } else {
      throw new Error(
        i18n(`${i18nKey}.errors.failedToFetchFolder`, { src, dest: destPath }),
        { cause: err }
      );
    }
  }

  if (failedPaths.size > 0) {
    throw new Error(i18n(`${i18nKey}.errors.incompleteFetch`, { src }));
  }

  logger.success(
    i18n(`${i18nKey}.completedFolderFetch`, {
      src,
      version: getAssetVersionIdentifier(options.assetVersion, src),
      dest,
    })
  );
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
  cmsPublishMode?: CmsPublishMode,
  options: FileMapperInputOptions = {}
): Promise<void> {
  if (!src) {
    return;
  }
  const { isFile } = getTypeDataFromPath(src);
  if (isFile) {
    await downloadFile(accountId, src, dest, cmsPublishMode, options);
  } else {
    await downloadFolder(accountId, src, dest, cmsPublishMode, options);
  }
}
