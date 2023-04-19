import fs from 'fs';

import { getFileInfoAsync, flattenAndRemoveSymlinks } from './read';
import { STAT_TYPES } from '../../constants/files';
import { FileData } from '../../types/Files';
import { throwError } from '../../errors/standardErrors';

export function listFilesInDir(dir: string): Array<string> {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(file => !file.isDirectory())
    .map(file => file.name);
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
      throwError(err);
    });
}
