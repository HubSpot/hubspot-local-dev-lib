import path from 'path';
import { ImportRequest } from '../types/Crm.js';
import { getCwd } from './path.js';
import fs from 'fs-extra';
import { i18n } from '../utils/lang.js';

export function getImportDataRequest(fileName: string): {
  importRequest: ImportRequest;
  dataFileNames: string[];
} {
  validateImportRequestFile(fileName);

  const importRequest: ImportRequest = fs.readJsonSync(
    path.resolve(getCwd(), fileName)
  );

  const dataFileNames: string[] = importRequest.files.map(
    file => file.fileName
  );

  // allow relative paths in the provided import request
  importRequest.files = importRequest.files.map(file => ({
    ...file,
    fileName: path.basename(file.fileName),
  }));

  if (dataFileNames.length === 0) {
    throw new Error(i18n('lib.crm.importData.errors.noFiles'));
  }

  dataFileNames.forEach(fileName => {
    if (!fileExists(fileName)) {
      throw new Error(
        i18n('lib.crm.importData.errors.fileNotFound', { fileName })
      );
    }
  });

  return { importRequest, dataFileNames };
}

export function validateImportRequestFile(fileName: string) {
  if (!fileExists(fileName)) {
    throw new Error(
      i18n('lib.crm.importData.errors.fileNotFound', { fileName })
    );
  }

  if (path.extname(fileName) !== '.json') {
    throw new Error(i18n('lib.crm.importData.errors.notJson'));
  }
}

function fileExists(_path: string): boolean {
  try {
    const absoluteSrcPath = path.resolve(getCwd(), _path);
    if (!absoluteSrcPath) return false;

    const stats = fs.statSync(absoluteSrcPath);
    const isFile = stats.isFile();

    if (!isFile) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}
