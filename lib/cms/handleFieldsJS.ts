import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fork } from 'child_process';
import { escapeRegExp } from '../escapeRegExp.js';
import { isModuleFolderChild } from '../../utils/cms/modules.js';
import { logger } from '../logger.js';
import { BaseError } from '../../types/Error.js';
import { i18n } from '../../utils/lang.js';

const i18nKey = 'lib.cms.handleFieldsJs';

export class FieldsJs {
  projectDir: string;
  filePath: string;
  rootWriteDir: string;
  rejected: boolean;
  fieldOptions: string | string[];
  outputPath?: string;
  toJSON?: () => JSON;

  constructor(
    projectDir: string,
    filePath: string,
    rootWriteDir?: string | null,
    fieldOptions: string | string[] = ''
  ) {
    this.projectDir = projectDir;
    this.filePath = filePath;
    this.fieldOptions = fieldOptions;
    this.rejected = false;
    // Create tmpDir if no writeDir is given.
    this.rootWriteDir =
      rootWriteDir === undefined || rootWriteDir === null
        ? createTmpDirSync('hubspot-temp-fieldsjs-output-')
        : rootWriteDir;
  }

  async init(): Promise<this> {
    const outputPath = await this.getOutputPathPromise();
    this.outputPath = this.rejected ? undefined : outputPath!;
    return this;
  }

  // Converts a fields.js file into a fields.json file, writes, and returns of fields.json
  convertFieldsJs(writeDir: string): Promise<string | void> {
    const filePath = this.filePath;
    const dirName = path.dirname(filePath);

    return new Promise<string>((resolve, reject) => {
      const fieldOptionsAsString = Array.isArray(this.fieldOptions)
        ? this.fieldOptions.join(',')
        : this.fieldOptions;

      const convertFieldsProcess = fork(
        path.join(__dirname, './processFieldsJs.js'),
        [],
        {
          cwd: dirName,
          env: {
            dirName,
            fieldOptions: fieldOptionsAsString,
            filePath,
            writeDir,
          },
        }
      );
      logger.debug(
        i18n(`${i18nKey}.convertFieldsJs.creating`, {
          pid: convertFieldsProcess.pid || '',
        })
      );
      convertFieldsProcess.on(
        'message',
        function (message: {
          action: string;
          finalPath: string;
          message: string;
        }) {
          if (message.action === 'ERROR') {
            reject(message.message);
          } else if (message.action === 'COMPLETE') {
            resolve(message.finalPath);
          }
        }
      );

      convertFieldsProcess.on('close', () => {
        logger.debug(
          i18n(`${i18nKey}.convertFieldsJs.terminating`, {
            pid: convertFieldsProcess.pid || '',
          })
        );
      });
    }).catch((e: BaseError) => {
      throw new Error(
        i18n(`${i18nKey}.convertFieldsJs.errors.errorConverting`, { filePath }),
        { cause: e }
      );
    });
  }

  /**
   * If there has been a fields.json written to the output path, then copy it from the output
   * directory to the project directory, respecting the path within the output directory.
   * Ex: path/to/tmp/example.module/fields.json => path/to/project/example.module/fields.output.json
   */
  saveOutput(): void {
    if (!this.outputPath || !fs.existsSync(this.outputPath)) {
      throw new Error(
        i18n(`${i18nKey}.saveOutput.errors.saveFailed`, {
          path: this.filePath,
        })
      );
    }
    const relativePath = path.relative(
      this.rootWriteDir,
      path.dirname(this.outputPath)
    );
    const savePath = path.join(
      this.projectDir,
      relativePath,
      'fields.output.json'
    );
    try {
      fs.copyFileSync(this.outputPath, savePath);
    } catch (err) {
      throw new Error(
        i18n(`${i18nKey}.saveOutput.errors.saveFailed`, { path: savePath }),
        { cause: err }
      );
    }
  }

  /**
   * Resolves the relative path to the fields.js within the project directory and returns
   * directory name to write to in rootWriteDir directory.
   *
   * Ex: If rootWriteDir = 'path/to/temp', filePath = 'projectRoot/sample.module/fields.js'. Then getWriteDir() => path/to/temp/sample.module
   */
  getWriteDir(): string {
    const projectDirRegex = new RegExp(`^${escapeRegExp(this.projectDir)}`);
    const relativePath = this.filePath.replace(projectDirRegex, '');
    return path.dirname(path.join(this.rootWriteDir, relativePath));
  }

  getOutputPathPromise(): Promise<string | void> {
    const writeDir = this.getWriteDir();
    return this.convertFieldsJs(writeDir).then(outputPath => outputPath);
  }
}

/**
 * Determines if file is a convertable fields.js file i.e., if it is called
 * 'fields.js' and in a root or in a module folder, and if convertFields flag is true.
 */
export function isConvertableFieldJs(
  rootDir: string,
  filePath: string,
  convertFields = false
): boolean {
  const allowedFieldsNames = ['fields.js', 'fields.mjs', 'fields.cjs'];
  const regex = new RegExp(`^${escapeRegExp(rootDir)}`);
  const relativePath = path.dirname(filePath.replace(regex, ''));
  const baseName = path.basename(filePath);
  const inModuleFolder = isModuleFolderChild({ path: filePath, isLocal: true });
  return !!(
    convertFields &&
    allowedFieldsNames.includes(baseName) &&
    (inModuleFolder || relativePath == path.sep)
  );
}

// Try creating tempdir
export function createTmpDirSync(prefix: string): string {
  let tmpDir: string;
  try {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  } catch (err) {
    throw new Error(i18n(`${i18nKey}.createTmpDirSync.errors.writeFailed`), {
      cause: err,
    });
  }
  return tmpDir;
}

// Try cleaning up resources from os's tempdir
export function cleanupTmpDirSync(tmpDir: string): void {
  fs.rm(tmpDir, { recursive: true }, err => {
    if (err) {
      throw new Error(
        i18n(`${i18nKey}.cleanupTmpDirSync.errors.deleteFailed`),
        { cause: err }
      );
    }
  });
}
