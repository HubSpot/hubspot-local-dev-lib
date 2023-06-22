// import fs from 'fs-extra';
// import path from 'path';
// import PQueue from 'p-queue';
// import { getCwd, getExt, convertToLocalFileSystemPath } from './path';
// import { fetchFileStream, download, downloadDefault } from '../api/fileMapper';
// import {
//   throwErrorWithMessage,
//   throwTypeErrorWithMessage,
// } from '../errors/standardErrors';
// import {
//   ALLOWED_EXTENSIONS,
//   MODULE_EXTENSION,
//   FUNCTIONS_EXTENSION,
//   MODE,
// } from '../constants/extensions';
// import { FileMapperNode, Mode } from '../types/Files';
// import { FileMapperOptions } from '../types/Files';
// import { throwFileSystemError } from '../errors/fileSystemErrors';
// import { BaseError } from '../types/Error';

// const queue = new PQueue({
//   concurrency: 10,
// });

// function isPathToFile(filepath: string): boolean {
//   const ext = getExt(filepath);
//   return !!ext && ext !== MODULE_EXTENSION && ext !== FUNCTIONS_EXTENSION;
// }

// function isPathToModule(filepath: string): boolean {
//   const ext = getExt(filepath);
//   return ext === MODULE_EXTENSION;
// }

// function isPathToRoot(filepath: string): boolean {
//   if (typeof filepath !== 'string') return false;
//   // Root pattern matches empty strings and: / \
//   return /^(\/|\\)?$/.test(filepath.trim());
// }

// function isPathToHubspot(filepath: string): boolean {
//   if (typeof filepath !== 'string') return false;
//   return /^(\/|\\)?@hubspot/i.test(filepath.trim());
// }

// function isAllowedExtension(filepath: string): boolean {
//   const ext = getExt(filepath);
//   if (!ext) return false;
//   return ALLOWED_EXTENSIONS.has(ext);
// }

// function useApiBuffer(mode: Mode): boolean {
//   return mode === MODE.DRAFT;
// }

// type FileMapperInputOptions = {
//   staging?: boolean;
//   assetVersion?: string;
//   overwrite?: boolean;
// };

// // Determines API param based on mode an options
// function getFileMapperQueryValues(
//   mode: Mode,
//   { staging, assetVersion }: FileMapperInputOptions
// ): FileMapperOptions {
//   return {
//     qs: {
//       buffer: useApiBuffer(mode),
//       environmentId: staging ? 2 : 1,
//       version: assetVersion,
//     },
//   };
// }

// // Determines version number to log based on input.options
// function getAssetVersionIdentifier(
//   assetVersion?: string,
//   src?: string
// ): string {
//   if (
//     typeof assetVersion !== 'undefined' &&
//     typeof src !== 'undefined' &&
//     src.startsWith('@hubspot/')
//   ) {
//     return ` v${assetVersion}`;
//   }
//   return '';
// }

// function validateFileMapperNode(node: FileMapperNode): void {
//   if (node === Object(node)) return;
//   let json;
//   try {
//     json = JSON.stringify(node, null, 2);
//   } catch (err) {
//     json = node;
//   }
//   throwTypeErrorWithMessage('filemapper.invalidNode', {
//     json: JSON.stringify(json),
//   });
// }

// type PathTypeData = {
//   isModule: boolean;
//   isHubspot: boolean;
//   isFile: boolean;
//   isRoot: boolean;
//   isFolder: boolean;
// };

// function getTypeDataFromPath(src: string): PathTypeData {
//   const isModule = isPathToModule(src);
//   const isHubspot = isPathToHubspot(src);
//   const isFile = !isModule && isPathToFile(src);
//   const isRoot = !isModule && !isFile && isPathToRoot(src);
//   const isFolder = !isFile;
//   return {
//     isModule,
//     isHubspot,
//     isFile,
//     isRoot,
//     isFolder,
//   };
// }

// type RecursiveFileMapperCallback = (
//   node: FileMapperNode,
//   filepath?: string,
//   depth?: number
// ) => boolean;

// function recurseFolder(
//   node: FileMapperNode,
//   callback: RecursiveFileMapperCallback,
//   filepath = '',
//   depth = 0
// ): boolean {
//   validateFileMapperNode(node);
//   const isRootFolder = node.folder && depth === 0;
//   if (isRootFolder) {
//     if (!filepath) {
//       filepath = node.name;
//     }
//   } else {
//     filepath = path.join(filepath, node.name);
//   }
//   let __break = callback(node, filepath, depth);
//   if (__break === false) return __break;
//   __break = node.children.every(childNode => {
//     __break = recurseFolder(childNode, callback, filepath, depth + 1);
//     return __break !== false;
//   });
//   return depth === 0 ? false : __break;
// }

// async function writeUtimes(
//   accountId: number,
//   filepath: string,
//   node: FileMapperNode
// ): Promise<void> {
//   try {
//     const now = new Date();
//     const atime = node.createdAt ? new Date(node.createdAt) : now;
//     const mtime = node.updatedAt ? new Date(node.updatedAt) : now;
//     await fs.utimes(filepath, atime, mtime);
//   } catch (err) {
//     throwFileSystemError(err as BaseError, {
//       filepath,
//       accountId,
//       write: true,
//     });
//   }
// }

// /**
//  * @private
//  * @async
//  * @param {FileMapperInputArguments} input
//  * @param {string} filepath
//  * @returns {Promise<boolean}
//  */
// async function skipExisting(
//   filepath: string,
//   overwrite = false
// ): Promise<boolean> {
//   if (overwrite) {
//     return false;
//   }
//   if (await fs.pathExists(filepath)) {
//     return true;
//   }
//   return false;
// }

// async function fetchAndWriteFileStream(
//   accountId: number,
//   srcPath: string,
//   filepath: string,
//   mode: Mode,
//   options: FileMapperInputOptions = {}
// ) {
//   if (typeof srcPath !== 'string' || !srcPath.trim()) {
//     // This avoids issue where API was returning v1 modules with `path: ""`
//     return null;
//   }
//   if (await skipExisting(filepath, options.overwrite)) {
//     return null;
//   }
//   if (!isAllowedExtension(srcPath)) {
//     throwErrorWithMessage('filemapper.invalidFileType', { srcPath });
//   }
//   try {
//     const node = await fetchFileStream(
//       accountId,
//       srcPath,
//       filepath,
//       getFileMapperQueryValues(mode, options)
//     );
//     await writeUtimes(accountId, filepath, node);
//   } catch (err) {
//     logApiErrorInstance(
//       err,
//       new ApiErrorContext({
//         accountId,
//         request: srcPath,
//       })
//     );
//     throw err;
//   }
// }

// /**
//  * Writes an individual file or folder (not recursive).  If file source is missing, the
//  * file is fetched.
//  *
//  * @private
//  * @async
//  * @param {FileMapperInputArguments} input
//  * @param {FileMapperNode}           node
//  * @param {string}                   filepath
//  * @returns {Promise}
//  */
// async function writeFileMapperNode(input, node, filepath) {
//   filepath = convertToLocalFileSystemPath(path.resolve(filepath));
//   if (await skipExisting(input, filepath)) {
//     return;
//   }
//   if (!node.folder) {
//     try {
//       await fetchAndWriteFileStream(input, node.path, filepath);
//       return;
//     } catch (err) {
//       return false;
//     }
//   }
//   try {
//     await fs.ensureDir(filepath);
//     logger.log('Wrote folder "%s"', filepath);
//   } catch (err) {
//     logFileSystemErrorInstance(
//       err,
//       new FileSystemErrorContext({
//         filepath,
//         accountId: input.accountId,
//         write: true,
//       })
//     );
//     return false;
//   }
// }

// function isTimeout(err) {
//   return !!err && (err.statusCode === 408 || err.code === 'ESOCKETTIMEDOUT');
// }

// // @hubspot assets have a periodic delay due to caching
// function logHubspotAssetTimeout() {
//   logger.error(
//     'HubSpot assets are unavailable at the moment. Please wait a few minutes and try again.'
//   );
// }

// /**
//  * @private
//  * @async
//  * @param {FileMapperInputArguments} input
//  * @returns {Promise}
//  */
// async function downloadFile(input) {
//   const { src } = input;
//   const { isFile, isHubspot } = getTypeDataFromPath(src);
//   try {
//     if (!isFile) {
//       throw new Error(`Invalid request for file: "${src}"`);
//     }
//     const dest = path.resolve(input.dest);
//     const cwd = getCwd();
//     let filepath;
//     if (dest === cwd) {
//       // Dest: CWD
//       filepath = path.resolve(cwd, path.basename(src));
//     } else if (isPathToFile(dest)) {
//       // Dest: file path
//       filepath = path.isAbsolute(dest) ? dest : path.resolve(cwd, dest);
//     } else {
//       // Dest: folder path
//       const name = path.basename(src);
//       filepath = path.isAbsolute(dest)
//         ? path.resolve(dest, name)
//         : path.resolve(cwd, dest, name);
//     }
//     const localFsPath = convertToLocalFileSystemPath(filepath);
//     await fetchAndWriteFileStream(input, input.src, localFsPath);
//     await queue.onIdle();
//     logger.success(
//       'Completed fetch of file "%s"%s to "%s" from the Design Manager',
//       input.src,
//       getAssetVersionIdentifier(input),
//       input.dest
//     );
//   } catch (err) {
//     if (isHubspot && isTimeout(err)) {
//       logHubspotAssetTimeout();
//     } else {
//       logger.error(
//         'Failed fetch of file "%s" to "%s" from the Design Manager',
//         input.src,
//         input.dest
//       );
//     }
//   }
// }

// /**
//  * @private
//  * @async
//  * @param {FileMapperInputArguments} input
//  * @returns {Promise<FileMapperNode}
//  */
// async function fetchFolderFromApi(input) {
//   const { accountId, src } = input;
//   const { isRoot, isFolder, isHubspot } = getTypeDataFromPath(src);
//   if (!isFolder) {
//     throw new Error(`Invalid request for folder: "${src}"`);
//   }
//   try {
//     const srcPath = isRoot ? '@root' : src;
//     const node = isHubspot
//       ? await downloadDefault(
//           accountId,
//           srcPath,
//           getFileMapperQueryValues(input)
//         )
//       : await download(accountId, srcPath, getFileMapperQueryValues(input));
//     logger.log(
//       'Fetched "%s" from account %d from the Design Manager successfully',
//       src,
//       accountId
//     );
//     return node;
//   } catch (err) {
//     if (isHubspot && isTimeout(err)) {
//       logHubspotAssetTimeout();
//     } else {
//       logApiErrorInstance(
//         err,
//         new ApiErrorContext({
//           accountId,
//           request: src,
//         })
//       );
//     }
//   }
//   return null;
// }

// /**
//  * @private
//  * @async
//  * @param {FileMapperInputArguments} input
//  * @returns {Promise}
//  */
// async function downloadFolder(input) {
//   try {
//     const node = await fetchFolderFromApi(input);
//     if (!node) {
//       return;
//     }
//     const dest = path.resolve(input.dest);
//     const rootPath =
//       dest === getCwd()
//         ? convertToLocalFileSystemPath(path.resolve(dest, node.name))
//         : dest;
//     let success = true;
//     recurseFolder(
//       node,
//       (childNode, { filepath }) => {
//         queue.add(async () => {
//           const succeeded = await writeFileMapperNode(
//             input,
//             childNode,
//             filepath
//           );
//           if (succeeded === false) {
//             success = false;
//           }
//         });
//       },
//       rootPath
//     );
//     await queue.onIdle();

//     if (success) {
//       logger.success(
//         'Completed fetch of folder "%s"%s to "%s" from the Design Manager',
//         input.src,
//         getAssetVersionIdentifier(input),
//         input.dest
//       );
//     } else {
//       logger.error(
//         `Not all files in folder "${input.src}" were successfully fetched.  Re-run the last command to try again`
//       );
//     }
//   } catch (err) {
//     logger.error(
//       'Failed fetch of folder "%s" to "%s" from the Design Manager',
//       input.src,
//       input.dest
//     );
//   }
// }

// /**
//  * Fetch a file/folder and write to local file system.
//  *
//  * @async
//  * @param {FileMapperInputArguments} input
//  * @returns {Promise}
//  */
// export async function downloadFileOrFolder(
//   accountId: number,
//   src: string,
//   dest: string,
//   mode: string,
//   options: FileMapperInputOptions = {}
// ): Promise<void> {
//   try {
//     if (!src) {
//       return;
//     }
//     const { isFile } = getTypeDataFromPath(src);
//     if (isFile) {
//       await downloadFile(input);
//     } else {
//       await downloadFolder(input);
//     }
//   } catch (err) {
//     // Specific handlers provide logging.
//   }
// }
