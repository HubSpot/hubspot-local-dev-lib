import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fork } from 'child_process';
import { escapeRegExp } from './escapeRegExp';
import { isModuleFolderChild } from '../lib/modules';
import { debug } from './logger';
import { throwErrorWithMessage, throwError } from '../errors/standardErrors';
import { BaseError } from '../types/Error';

const i18nKey = 'utils.handleFields';

export class FieldsJs {
  projectDir: string;
  filePath: string;
  rootWriteDir: string;
  rejected: boolean;
  fieldOptions: string;
  outputPath?: string;

  constructor(
    projectDir: string,
    filePath: string,
    rootWriteDir?: string,
    fieldOptions = ''
  ) {
    this.projectDir = projectDir;
    this.filePath = filePath;
    this.fieldOptions = fieldOptions;
    this.rejected = false;
    // Create tmpDir if no writeDir is given.
    this.rootWriteDir =
      rootWriteDir === undefined
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
      const convertFieldsProcess = fork(
        path.join(__dirname, './processFieldsJs.js'),
        [],
        {
          cwd: dirName,
          env: {
            dirName,
            fieldOptions: this.fieldOptions,
            filePath,
            writeDir,
          },
        }
      );
      debug(`${i18nKey}.convertFieldsJs.creating`, {
        pid: convertFieldsProcess.pid || '',
      });
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
        debug(`${i18nKey}.convertFieldsJs.terminating`, {
          pid: convertFieldsProcess.pid || '',
        });
      });
    }).catch((e: BaseError) => {
      debug(`${i18nKey}.convertFieldsJs.error`, { filePath });
      throwError(e);
    });
  }

  /**
   * If there has been a fields.json written to the output path, then copy it from the output
   * directory to the project directory, respecting the path within the output directory.
   * Ex: path/to/tmp/example.module/fields.json => path/to/project/example.module/fields.output.json
   */
  saveOutput(): void {
    if (!this.outputPath || !fs.existsSync(this.outputPath)) {
      throwErrorWithMessage(`${i18nKey}.saveOutput`, { path: this.filePath });
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
      debug(`${i18nKey}.saveOutput`, { path: savePath });
      throwError(err as BaseError);
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

type FieldsArray<T> = Array<T | FieldsArray<T>>;

/*
 * Polyfill for `Array.flat(Infinity)` since the `flat` is only available for Node v11+
 * https://stackoverflow.com/a/15030117
 */
function flattenArray<T>(arr: FieldsArray<T>): Array<T> {
  return arr.reduce((flat: Array<T>, toFlatten: T | FieldsArray<T>) => {
    return flat.concat(
      Array.isArray(toFlatten) ? flattenArray(toFlatten) : toFlatten
    );
  }, []);
}

//Transform fields array to JSON
export function fieldsArrayToJson<T>(fields: FieldsArray<T>): string {
  const flattened = flattenArray(fields);
  return JSON.stringify(flattened, null, 2);
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
    (inModuleFolder || relativePath == '/')
  );
}

// Try creating tempdir
export function createTmpDirSync(prefix: string): string {
  let tmpDir: string;
  try {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  } catch (err) {
    debug(`${i18nKey}.createTmpDirSync.error`);
    throwError(err as BaseError);
  }
  return tmpDir;
}

// Try cleaning up resources from os's tempdir
export function cleanupTmpDirSync(tmpDir: string): void {
  fs.rm(tmpDir, { recursive: true }, err => {
    if (err) {
      debug(`${i18nKey}.cleanupTmpDirSync.error`);
      throwError(err as BaseError);
    }
  });
}
