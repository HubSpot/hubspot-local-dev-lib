import fs from 'fs-extra';
import { HUBL_EXTENSIONS } from './constants/extensions';
import { validateHubl } from './api/validateHubl';
import { walk } from './lib/fs';
import { log } from './utils/logger';
import { getExt } from './lib/path';
import {
  LintResult,
  Validation,
  HubLValidationError,
} from './types/HublValidation';

export async function lint(
  accountId: number,
  filepath: string,
  callback?: (LintResult) => number
): Promise<LintResult | number | object> {
  const stats = await fs.stat(filepath);
  const files = stats.isDirectory() ? await walk(filepath) : [filepath];
  if (!(files && files.length)) {
    return {};
  }
  return Promise.all(
    files
      .filter(file => HUBL_EXTENSIONS.has(getExt(file)))
      .map(async file => {
        const source = await fs.readFile(file, { encoding: 'utf8' });
        if (!(source && source.trim())) {
          const result = { file, validation: null };
          if (callback) {
            callback(result);
          }
          return result;
        }
        const validation = await validateHubl(accountId, source);
        const result = {
          file,
          validation,
        };
        if (callback) {
          callback(result);
        }
        return result;
      })
  );
}

function getErrorsFromHublValidationObject(
  validation: Validation
): Array<HubLValidationError> {
  return (
    (validation && validation.meta && validation.meta.template_errors) || []
  );
}

function printHublValidationError(err: HubLValidationError): void {
  const { severity, message, lineno, startPosition } = err;
  const method = severity === 'FATAL' ? 'error' : 'warn';
  log[method]('[%d, %d]: %s', lineno, startPosition, message);
}

export function printHublValidationResult({ validation }): number {
  let count = 0;
  const errors = getErrorsFromHublValidationObject(validation);
  if (!errors.length) {
    return count;
  }
  errors.forEach(err => {
    if (err.reason !== 'SYNTAX_ERROR') {
      return;
    }
    ++count;
    printHublValidationError(err);
  });
  return count;
}
