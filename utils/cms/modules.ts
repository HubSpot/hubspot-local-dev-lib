import path from 'path';
import { getExt, splitHubSpotPath, splitLocalPath } from '../../lib/path';
import { MODULE_EXTENSION } from '../../constants/extensions';
import { PathInput } from '../../types/Modules';
import { i18n } from '../lang';

const i18nKey = 'utils.cms.modules';

const isBool = (x: boolean | undefined) => !!x === x;

export function isPathInput(pathInput?: PathInput): boolean {
  return !!(
    pathInput &&
    typeof pathInput.path === 'string' &&
    (isBool(pathInput.isLocal) || isBool(pathInput.isHubSpot))
  );
}

function throwInvalidPathInput(pathInput: PathInput): void {
  if (isPathInput(pathInput)) return;
  throw new Error(i18n(`${i18nKey}.throwInvalidPathInput`));
}

export function isModuleFolder(pathInput: PathInput): boolean {
  throwInvalidPathInput(pathInput);
  const _path = pathInput.isHubSpot
    ? path.posix.normalize(pathInput.path)
    : path.normalize(pathInput.path);
  return getExt(_path) === MODULE_EXTENSION;
}

export function isModuleFolderChild(
  pathInput: PathInput,
  ignoreLocales = false
): boolean {
  throwInvalidPathInput(pathInput);
  let pathParts: Array<string> = [];
  if (pathInput.isLocal) {
    pathParts = splitLocalPath(pathInput.path);
  } else if (pathInput.isHubSpot) {
    pathParts = splitHubSpotPath(pathInput.path);
  }
  const { length } = pathParts;
  // Not a child path?
  if (length <= 1) return false;
  // Check if we should ignore this file
  if (ignoreLocales && pathParts.find(part => part === '_locales')) {
    return false;
  }
  // Check if any parent folders are module folders.
  return pathParts
    .slice(0, length - 1)
    .some(part => isModuleFolder({ ...pathInput, path: part }));
}
