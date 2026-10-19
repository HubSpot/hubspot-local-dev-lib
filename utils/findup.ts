import fs from 'fs';
import path from 'path';
import { findUpSync } from 'find-up';

type FindupOptions = {
  cwd?: string;
  nocase?: boolean;
};

function findCaseInsensitiveName(
  dir: string,
  fileName: string
): string | undefined {
  const upperCaseFileName = fileName.toUpperCase();

  try {
    return fs
      .readdirSync(dir)
      .find(entry => entry.toUpperCase() === upperCaseFileName);
  } catch (e) {
    return undefined;
  }
}

function findNameInDir(dir: string, fileName: string): string | undefined {
  if (fs.existsSync(path.resolve(dir, fileName))) {
    return fileName;
  }

  const match = findCaseInsensitiveName(
    path.resolve(dir, path.dirname(fileName)),
    path.basename(fileName)
  );
  return match ? path.join(path.dirname(fileName), match) : undefined;
}

export function findup(
  fileNames: string | Array<string>,
  options: FindupOptions = {}
): string | null {
  const findUpOptions = { cwd: options.cwd, type: 'both' } as const;

  if (!options.nocase) {
    return findUpSync(fileNames, findUpOptions) ?? null;
  }

  const names = Array.isArray(fileNames) ? fileNames : [fileNames];
  const match = findUpSync(dir => {
    for (const fileName of names) {
      const nameInDir = findNameInDir(dir, fileName);
      if (nameInDir) {
        return nameInDir;
      }
    }
    return undefined;
  }, findUpOptions);

  return match ?? null;
}
