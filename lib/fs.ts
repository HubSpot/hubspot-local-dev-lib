import fs from 'fs';
import path from 'path';

import { STAT_TYPES } from '../constants/files';
import { StatType, FileData } from '../types/Files';

export function getFileInfoAsync(dir: string, file: string): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const filepath = path.join(dir, file);
    fs.lstat(filepath, (error, stats) => {
      if (error) {
        reject(error);
      }
      let type: StatType = STAT_TYPES.FILE;
      if (stats.isSymbolicLink()) {
        type = STAT_TYPES.SYMBOLIC_LINK;
      } else if (stats.isDirectory()) {
        type = STAT_TYPES.DIRECTORY;
      }
      resolve({ filepath, type });
    });
  });
}

export function flattenAndRemoveSymlinks(
  filesData: Array<FileData>
): Array<string> {
  return filesData.reduce((acc: Array<string>, fileData) => {
    switch (fileData.type) {
      case STAT_TYPES.FILE:
        return acc.concat(fileData.filepath);
      case STAT_TYPES.DIRECTORY:
        return acc.concat(fileData.files || []);
      case STAT_TYPES.SYMBOLIC_LINK:
        return acc;
      default:
        return acc;
    }
  }, []);
}

const generateRecursiveFilePromise = async (
  dir: string,
  file: string
): Promise<FileData> => {
  return getFileInfoAsync(dir, file).then(fileData => {
    return new Promise(resolve => {
      if (fileData.type === STAT_TYPES.DIRECTORY) {
        walk(fileData.filepath).then(files => {
          resolve({ ...fileData, files });
        });
      } else {
        resolve(fileData);
      }
    });
  });
};

export async function walk(dir: string): Promise<Array<string>> {
  function processFiles(files: Array<string>) {
    return Promise.all(
      files.map(file => generateRecursiveFilePromise(dir, file))
    );
  }

  return fs.promises
    .readdir(dir)
    .then(processFiles)
    .then(flattenAndRemoveSymlinks)
    .catch(err => {
      throw err;
    });
}
