import path from 'path';
import unixify from 'unixify';
import { ALLOWED_EXTENSIONS } from '../constants/extensions';

export function convertToUnixPath(_path: string): string {
  return unixify(path.normalize(_path));
}

function convertToWindowsPath(_path: string): string {
  const rgx = new RegExp(`\\${path.posix.sep}`, 'g');
  return path.normalize(_path).replace(rgx, path.win32.sep);
}

export function convertToLocalFileSystemPath(_path: string): string {
  switch (path.sep) {
    case path.posix.sep:
      return convertToUnixPath(_path);
    case path.win32.sep:
      return convertToWindowsPath(_path);
    default:
      return path.normalize(_path);
  }
}

function removeTrailingSlashFromSplits(parts: Array<string>): Array<string> {
  if (parts.length > 1 && parts[parts.length - 1] === '') {
    return parts.slice(0, parts.length - 1);
  }
  return parts;
}

// Splits a filepath for local file system sources.
export function splitLocalPath(
  filepath: string,
  pathImplementation: path.PlatformPath = path
): Array<string> {
  if (!filepath) return [];
  const { sep } = pathImplementation;
  const rgx = new RegExp(`\\${sep}+`, 'g');
  const parts = pathImplementation.normalize(filepath).split(rgx);
  // Restore posix root if present
  if (sep === path.posix.sep && parts[0] === '') {
    parts[0] = '/';
  }
  return removeTrailingSlashFromSplits(parts);
}

// Splits a filepath for remote sources (HubSpot).
export function splitHubSpotPath(filepath: string): Array<string> {
  if (!filepath) return [];
  const rgx = new RegExp(`\\${path.posix.sep}+`, 'g');
  const parts = convertToUnixPath(filepath).split(rgx);
  // Restore root if present
  if (parts[0] === '') {
    parts[0] = '/';
  }
  return removeTrailingSlashFromSplits(parts);
}

export function getCwd(): string {
  if (process.env.INIT_CWD) {
    return process.env.INIT_CWD;
  }
  return process.cwd();
}

export function getExt(filepath: string): string {
  if (typeof filepath !== 'string') return '';
  const ext = path.extname(filepath).trim().toLowerCase();
  return ext[0] === '.' ? ext.slice(1) : ext;
}

export function getAllowedExtensions(
  allowList: Array<string> = []
): Set<string> {
  return new Set([...Array.from(ALLOWED_EXTENSIONS), ...allowList]);
}

export function isAllowedExtension(
  filepath: string,
  allowList: Array<string> = []
): boolean {
  const ext = getExt(filepath);
  const allowedExtensions = getAllowedExtensions(allowList);
  return allowedExtensions.has(ext);
}

export function getAbsoluteFilePath(_path: string): string {
  return path.resolve(getCwd(), _path);
}
