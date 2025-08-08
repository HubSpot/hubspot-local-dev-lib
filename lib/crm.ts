import path from 'path';
import { ImportRequest } from '../types/Crm';
import { getCwd } from './path';
import fs from 'fs-extra';
import { i18n } from '../utils/lang';

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
