import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fork } from 'child_process';
import { escapeRegExp } from '../../utils/escapeRegExp';
import { isModuleFolderChild } from '../../utils/cms/modules';
import { debug } from '../../utils/logger';
import { throwErrorWithMessage } from '../../errors/standardErrors';
import { BaseError } from '../../types/Error';

const i18nKey = 'lib.cms.handleFieldsJs';

export class FieldsJs {
  projectDir: string;
  pathToFieldsJs: string;
  rejected: boolean;
  fieldOptions: string;

  constructor(projectDir: string, pathToFieldsJs: string, fieldOptions = '') {
    this.projectDir = projectDir;
    this.pathToFieldsJs = pathToFieldsJs;
    this.fieldOptions = fieldOptions;
    this.rejected = false;
  }

  /*
   * Returns output raw JSON from converting FieldsJS
   */
  convert(): Promise<string | void> {
    const filePath = this.pathToFieldsJs;
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
          },
        }
      );
      debug(`${i18nKey}.convertFieldsJs.creating`, {
        pid: convertFieldsProcess.pid || '',
      });
      convertFieldsProcess.on(
        'message',
        (message: { action: string; json: string; message: string }) => {
          if (message.action === 'ERROR') {
            reject(message.message);
          } else if (message.action === 'COMPLETE') {
            resolve(message.json);
          }
        }
      );

      convertFieldsProcess.on('close', () => {
        debug(`${i18nKey}.convertFieldsJs.terminating`, {
          pid: convertFieldsProcess.pid || '',
        });
      });
    }).catch((e: BaseError) => {
      this.rejected = true;
      throwErrorWithMessage(
        `${i18nKey}.convertFieldsJs.errors.errorConverting`,
        { filePath },
        e
      );
    });
  }

  /**
   * Resolves the relative path to the fields.js within the project directory and returns
   * directory name to write to in writeDir directory.
   *
   * Ex: If writeDir = 'path/to/temp', filePath = 'projectRoot/sample.module/fields.js'. Then getWriteDir() => path/to/temp/sample.module
   */
  getWritePath(writeDir: string): string {
    const projectDirRegex = new RegExp(`^${escapeRegExp(this.projectDir)}`);
    const relativePath = this.pathToFieldsJs.replace(projectDirRegex, '');
    return path.dirname(path.join(writeDir, relativePath, 'fields.json'));
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
    (inModuleFolder || relativePath == '/')
  );
}

/**
 * Determines if fields js is present in a directory
 * 'fields.js' and in a root or in a module folder, and if convertFields flag is true.
 */
export function isFieldsJsPresent(dir: string): boolean {
  const filesInDir = fs.readdirSync(dir);
  return filesInDir.filter(file => isConvertableFieldJs(dir, file)).length > 0;
}

// Try creating tempdir
export function createTmpDirSync(prefix: string): string {
  let tmpDir: string;
  try {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  } catch (err) {
    throwErrorWithMessage(
      `${i18nKey}.createTmpDirSync.errors.writeFailed`,
      {},
      err as BaseError
    );
  }
  return tmpDir;
}

// Try cleaning up resources from os's tempdir
export function cleanupTmpDirSync(tmpDir: string): void {
  fs.rm(tmpDir, { recursive: true }, err => {
    if (err) {
      throwErrorWithMessage(
        `${i18nKey}.cleanupTmpDirSync.errors.deleteFailed`,
        {},
        err as BaseError
      );
    }
  });
}
