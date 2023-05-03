import path from 'path';
import fs from 'fs-extra';
import { getCwd, getExt, splitHubSpotPath, splitLocalPath } from './path';
import { walk } from '../utils/fs';
import { MODULE_EXTENSION } from '../constants/extensions';
import { downloadGithubRepoContents } from './github';
import {
  throwErrorWithMessage,
  throwTypeErrorWithMessage,
} from '../errors/standardErrors';
import { LogCallbacksArg } from '../types/LogCallbacks';
import { makeTypedLogger } from '../utils/logger';
import { PathInput } from '../types/Modules';

// Matches files named module.html
const MODULE_HTML_EXTENSION_REGEX = new RegExp(
  /\.module(?:\/|\\)module\.html$/
);
// Matches files named module.css
const MODULE_CSS_EXTENSION_REGEX = new RegExp(/\.module(?:\/|\\)module\.css$/);

const isBool = (x: boolean | undefined) => !!x === x;

function isPathInput(pathInput?: PathInput): boolean {
  return !!(
    pathInput &&
    typeof pathInput.path === 'string' &&
    (isBool(pathInput.isLocal) || isBool(pathInput.isHubSpot))
  );
}

function throwInvalidPathInput(pathInput: PathInput): void {
  if (isPathInput(pathInput)) return;
  throwTypeErrorWithMessage('modules.throwInvalidPathInput');
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

// Ids for testing
export const ValidationIds = {
  SRC_REQUIRED: 'SRC_REQUIRED',
  DEST_REQUIRED: 'DEST_REQUIRED',
  MODULE_FOLDER_REQUIRED: 'MODULE_FOLDER_REQUIRED',
  MODULE_TO_MODULE_NESTING: 'MODULE_TO_MODULE_NESTING',
  MODULE_NESTING: 'MODULE_NESTING',
};

type ValidationResult = {
  id: string;
  message: string;
};

const getValidationResult = (
  id: string,
  message: string
): ValidationResult => ({ id, message });

export async function validateSrcAndDestPaths(
  src?: PathInput,
  dest?: PathInput
): Promise<Array<ValidationResult>> {
  const results = [];
  if (!isPathInput(src)) {
    results.push(
      getValidationResult(ValidationIds.SRC_REQUIRED, '`src` is required.')
    );
  }
  if (!isPathInput(dest)) {
    results.push(
      getValidationResult(ValidationIds.DEST_REQUIRED, '`dest` is required.')
    );
  }
  if (results.length || !src || !dest) {
    return results;
  }
  const [_src, _dest] = [src, dest].map(inputPath => {
    const result = { ...inputPath };
    if (result.isLocal) {
      result.path = path.resolve(getCwd(), result.path);
    } else if (result.isHubSpot) {
      result.path = path.posix.normalize(result.path);
    }
    return result;
  });
  // src is a .module folder and dest is within a module. (Nesting)
  // e.g. `upload foo.module bar.module/zzz`
  if (isModuleFolder(_src) && isModuleFolderChild(_dest)) {
    return results.concat(
      getValidationResult(
        ValidationIds.MODULE_TO_MODULE_NESTING,
        '`src` is a module path and `dest` is within a module.'
      )
    );
  }
  // src is a .module folder but dest is not
  // e.g. `upload foo.module bar`
  if (isModuleFolder(_src) && !isModuleFolder(_dest)) {
    return results.concat(
      getValidationResult(
        ValidationIds.MODULE_FOLDER_REQUIRED,
        '`src` is a module path but `dest` is not.'
      )
    );
  }
  // src is a folder that includes modules and dest is within a module. (Nesting)
  if (_src.isLocal && isModuleFolderChild(_dest)) {
    const stat = await fs.stat(_src.path);
    if (stat.isDirectory()) {
      const files = await walk(_src.path);
      const srcHasModulesChildren = files.some(file =>
        isModuleFolderChild({ ..._src, path: file })
      );
      if (srcHasModulesChildren) {
        return results.concat(
          getValidationResult(
            ValidationIds.MODULE_NESTING,
            '`src` contains modules and `dest` is within a module.'
          )
        );
      }
    }
  }
  return results;
}

export const isModuleHTMLFile = (filePath: string) =>
  MODULE_HTML_EXTENSION_REGEX.test(filePath);

export const isModuleCSSFile = (filePath: string) =>
  MODULE_CSS_EXTENSION_REGEX.test(filePath);

type ModuleDefinition = {
  contentTypes: Array<string>;
  moduleLabel: string;
  global: boolean;
};

const createModuleCallbackKeys = ['creatingPath', 'creatingModule'] as const;

export async function createModule(
  moduleDefinition: ModuleDefinition,
  name: string,
  dest: string,
  options = {
    allowExistingDir: false,
  },
  logCallbacks?: LogCallbacksArg<typeof createModuleCallbackKeys>
) {
  const logger = makeTypedLogger<typeof createModuleCallbackKeys>(
    logCallbacks,
    'modules.createModule'
  );
  const writeModuleMeta = (
    { contentTypes, moduleLabel, global }: ModuleDefinition,
    dest: string
  ) => {
    const metaData = {
      label: moduleLabel,
      css_assets: [],
      external_js: [],
      global: global,
      help_text: '',
      host_template_types: contentTypes,
      js_assets: [],
      other_assets: [],
      smart_type: 'NOT_SMART',
      tags: [],
      is_available_for_new_content: false,
    };

    fs.writeJSONSync(dest, metaData, { spaces: 2 });
  };

  const moduleFileFilter = (src: string, dest: string) => {
    const emailEnabled = moduleDefinition.contentTypes.includes('EMAIL');

    switch (path.basename(src)) {
      case 'meta.json':
        writeModuleMeta(moduleDefinition, dest);
        return false;
      case 'module.js':
      case 'module.css':
        if (emailEnabled) {
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const folderName =
    !name || name.endsWith('.module') ? name : `${name}.module`;
  const destPath = path.join(dest, folderName);
  if (!options.allowExistingDir && fs.existsSync(destPath)) {
    throwErrorWithMessage('modules.createModule', {
      path: destPath,
    });
  } else {
    logger('creatingPath', {
      path: destPath,
    });
    fs.ensureDirSync(destPath);
  }

  logger('creatingModule', {
    path: destPath,
  });

  await downloadGithubRepoContents(
    'cms-sample-assets',
    'modules/Sample.module',
    destPath,
    moduleFileFilter
  );
}
