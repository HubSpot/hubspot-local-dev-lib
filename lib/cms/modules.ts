import path from 'path';
import fs from 'fs-extra';
import { getCwd } from '../path';
import { walk } from '../fs';
import { listGithubRepoContents, downloadGithubRepoContents } from '../github';
import { throwErrorWithMessage } from '../../errors/standardErrors';
import { logger } from '../logging/logger';
import {
  isPathInput,
  isModuleFolder,
  isModuleFolderChild,
} from '../../utils/cms/modules';
import { PathInput } from '../../types/Modules';
import { i18n } from '../../utils/lang';

const i18nKey = 'lib.cms.modules';

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

/* createModule() helper
 * Takes a file and uses the constants above to transform the contents
 */

// Strings to replace in React module files
const MODULE_STRING_TRANSFORMATIONS = [
  {
    regex: /\/\* import global styles \*\//g,
    string: 'import "./global-samplejsr.css";',
    fallback: '',
  },
  {
    regex: /\/\* Default config \*\//g,
    string:
      'export const defaultModuleConfig = { \n  moduleName: "sample_jsr", \n  version: 0, \n};',
    fallback: '',
  },
];

const updateFileContents = async (
  file: string,
  metaData: object,
  getInternalVersion: boolean
) => {
  try {
    let fileContents = await fs.readFile(file, 'utf8'); // returns Promise

    MODULE_STRING_TRANSFORMATIONS.forEach(entry => {
      const replacementString = getInternalVersion
        ? entry.string
        : entry.fallback;

      fileContents = fileContents.replace(entry.regex, replacementString);
    });

    await fs.writeFile(file, fileContents, 'utf8');

    await fs.appendFile(
      file,
      'export const meta = ' + JSON.stringify(metaData, null, ' ')
    );
  } catch (error) {
    const { message } = error as Error;
    throwErrorWithMessage(`${i18nKey}.createModule.errors.fileUpdateFailure`, {
      path: file,
      errorMessage: message,
    });
  }
};

type ModuleDefinition = {
  contentTypes: Array<string>;
  moduleLabel: string;
  reactType: boolean;
  global: boolean;
};

export async function createModule(
  moduleDefinition: ModuleDefinition,
  name: string,
  dest: string,
  getInternalVersion: boolean,
  options = {
    allowExistingDir: false,
  }
) {
  const {
    moduleLabel,
    contentTypes,
    global,
    reactType: isReactModule,
  } = moduleDefinition;

  const moduleMetaData = {
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

  const folderName = name.endsWith('.module') ? name : `${name}.module`;
  const destPath = !isReactModule
    ? path.join(dest, folderName)
    : path.join(dest, `${name}`);

  if (!options.allowExistingDir && fs.existsSync(destPath)) {
    throwErrorWithMessage(`${i18nKey}.createModule.errors.pathExists`, {
      path: destPath,
    });
  } else {
    logger.log(
      i18n(`${i18nKey}.createModule.creatingPath`, {
        path: destPath,
      })
    );
    fs.ensureDirSync(destPath);
  }

  logger.log(
    i18n(`${i18nKey}.createModule.creatingModule`, {
      path: destPath,
    })
  );

  // Filter out certain fetched files from the response
  const moduleFileFilter = (src: string, dest: string) => {
    const emailEnabled = moduleDefinition.contentTypes.includes('EMAIL');

    switch (path.basename(src)) {
      case 'meta.json':
        fs.writeJSONSync(dest, moduleMetaData, { spaces: 2 }); // writing a meta.json file to standard HubL modules
        return false;
      case 'module.js':
      case 'module.css':
        if (emailEnabled) {
          return false;
        }
        return true;
      case 'global-samplejsr.css':
      case 'stories':
      case 'tests':
        if (getInternalVersion) {
          return true;
        }
        return false;
      default:
        return true;
    }
  };

  // Download gitHub contents to the dest directory
  const sampleAssetPath = !isReactModule
    ? 'Sample.module'
    : 'SampleReactModule';

  await downloadGithubRepoContents(
    'HubSpot/cms-sample-assets',
    `modules/${sampleAssetPath}`,
    destPath,
    '',
    moduleFileFilter
  );

  // Updating React module files after fetch
  if (isReactModule) {
    await updateFileContents(
      `${destPath}/index.tsx`,
      moduleMetaData,
      getInternalVersion
    );
  }
}

export async function retrieveDefaultModule(
  name: string | undefined,
  dest: string
) {
  if (!name) {
    const defaultReactModules = await listGithubRepoContents(
      'HubSpot/cms-sample-assets',
      'modules/',
      'dir'
    );
    return defaultReactModules;
  }

  await downloadGithubRepoContents(
    'HubSpot/cms-sample-assets',
    `modules/${name}`,
    dest
  );
}
