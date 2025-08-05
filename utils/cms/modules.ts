import path from 'path';
import { getExt, splitHubSpotPath, splitLocalPath } from '../../lib/path';
import { MODULE_EXTENSION } from '../../constants/extensions';
import { PathInput } from '../../types/Modules';
import { i18n } from '../lang';
import { download } from '../../api/fileMapper';

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

/**
 * Checks if a module is new (doesn't exist on the server yet) by attempting to download it.
 * @param accountId The HubSpot account ID
 * @param modulePath The module path to check
 * @param apiOptions API options for the request
 * @returns Promise<boolean> - true if module is new (doesn't exist), false if it exists
 */
export async function isModuleNew(
  accountId: number,
  modulePath: string,
  apiOptions: any
): Promise<boolean> {
  try {
    await download(accountId, modulePath, apiOptions);
    return false; // Module exists
  } catch (error: any) {
    if (error.response?.status === 404 || error.status === 404) {
      return true; // Module doesn't exist (net-new)
    }
    // For other errors, assume module exists to be safe
    return false;
  }
}
