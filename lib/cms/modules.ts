import path from 'path';
import fs from 'fs-extra';
import { getCwd } from '../path';
import { walk } from '../fs';
import { downloadGithubRepoContents } from '../github';
import { throwErrorWithMessage } from '../../errors/standardErrors';
import { LogCallbacksArg } from '../../types/LogCallbacks';
import { makeTypedLogger } from '../../utils/logger';
import {
  isPathInput,
  isModuleFolder,
  isModuleFolderChild,
} from '../../utils/cms/modules';
import { PathInput } from '../../types/Modules';

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

type ModuleDefinition = {
  contentTypes: Array<string>;
  moduleLabel: string;
  reactType: boolean;
  global: boolean;
};

const createModuleCallbackKeys = ['creatingPath', 'creatingModule'] as const;

export async function createModule(
  moduleDefinition: ModuleDefinition,
  name: string,
  dest: string,
  getInternalVersion: boolean,
  options = {
    allowExistingDir: false,
  },
  logCallbacks?: LogCallbacksArg<typeof createModuleCallbackKeys>
) {
  const logger = makeTypedLogger<typeof createModuleCallbackKeys>(logCallbacks);
  const { reactType: isReactModule } = moduleDefinition;

  // Ascertain the module's dest path based on module type
  const parseDestPath = (
    name: string,
    dest: string,
    isReactModule: boolean
  ) => {
    const folderName = name.endsWith('.module') ? name : `${name}.module`;

    const modulePath = !isReactModule
      ? path.join(dest, folderName)
      : path.join(dest, `${name}`);

    return modulePath;
  };

  const destPath = parseDestPath(name, dest, isReactModule);

  // Create module directory
  const createModuleDirectory = (
    allowExistingDir: boolean,
    destPath: string
  ) => {
    if (!allowExistingDir && fs.existsSync(destPath)) {
      throwErrorWithMessage(`${i18nKey}.createModule.errors.pathExists`, {
        path: destPath,
      });
    } else {
      logger('creatingPath', `${i18nKey}.createModule.creatingPath`, {
        path: destPath,
      });
      fs.ensureDirSync(destPath);
    }

    logger('creatingModule', `${i18nKey}.createModule.creatingModule`, {
      path: destPath,
    });
  };

  createModuleDirectory(options.allowExistingDir, destPath);

  // Write module meta
  const writeModuleMeta = (
    { moduleLabel, contentTypes, global, reactType }: ModuleDefinition,
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

    if (!reactType) {
      fs.writeJSONSync(dest, metaData, { spaces: 2 });
    } else {
      const globalImportString = getInternalVersion
        ? 'import "./global-samplejsr.css";'
        : '';
      const defaultconfigString = getInternalVersion
        ? `export const defaultModuleConfig = {
  moduleName: "sample_jsr",
  version: 0,
};
    `
        : '';

      fs.readFile(`${destPath}/index.tsx`, 'utf8', function (err, data) {
        if (err) {
          throwErrorWithMessage(
            `${i18nKey}.createModule.errors.fileReadFailure`,
            {
              path: `${dest}/index.tsx`,
            }
          );
        }

        const result = data
          .replace(/\/\* import global styles \*\//g, globalImportString)
          .replace(/\/\* Default config \*\//g, defaultconfigString);

        fs.writeFile(`${destPath}/index.tsx`, result, 'utf8', function (err) {
          if (err) return console.log(err);
        });

        fs.appendFile(
          `${dest}/index.tsx`,
          'export const meta = ' + JSON.stringify(metaData, null, ' '),
          err => {
            if (err) {
              throwErrorWithMessage(
                `${i18nKey}.createModule.errors.failedToWrite`,
                {
                  path: `${dest}/index.tsx`,
                }
              );
            }
          }
        );
      });
    }
  };

  // Filter out ceratin fetched files from the response
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
  const sampleAssetPath = !isReactModule ? 'Sample.module' : 'SampleJSR';

  await downloadGithubRepoContents(
    'HubSpot/cms-sample-assets',
    `modules/${sampleAssetPath}`,
    destPath,
    '',
    moduleFileFilter
  );

  // Mutating React module files after fetch
  if (isReactModule) {
    writeModuleMeta(moduleDefinition, destPath);
  }
}
