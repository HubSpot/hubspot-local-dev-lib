import fs from 'fs';
import path from 'path';

type FindupOptions = {
  cwd?: string;
  nocase?: boolean;
};

function findCaseInsensitiveMatch(filePath: string): string | null {
  const dir = path.dirname(filePath);
  const upperCaseFileName = path.basename(filePath).toUpperCase();
  let entries: Array<string>;

  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    return null;
  }

  const match = entries.find(
    entry => entry.toUpperCase() === upperCaseFileName
  );
  return match ? path.resolve(dir, match) : null;
}

function findInDir(
  dir: string,
  fileName: string,
  nocase: boolean
): string | null {
  const filePath = path.resolve(dir, fileName);

  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return nocase ? findCaseInsensitiveMatch(filePath) : null;
}

export function findup(
  fileNames: string | Array<string>,
  options: FindupOptions = {}
): string | null {
  const names = Array.isArray(fileNames) ? fileNames : [fileNames];
  const nocase = options.nocase === true;
  let currentDir = path.resolve(options.cwd || '');
  let previousDir: string | null = null;

  while (currentDir !== previousDir) {
    for (const fileName of names) {
      const match = findInDir(currentDir, fileName, nocase);
      if (match) {
        return match;
      }
    }
    previousDir = currentDir;
    currentDir = path.dirname(currentDir);
  }

  return null;
}
