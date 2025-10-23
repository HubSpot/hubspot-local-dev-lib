import fs from 'fs-extra';
import { HUBL_EXTENSIONS } from '../../constants/extensions.js';
import { validateHubl } from '../../api/validateHubl.js';
import { walk } from '../fs.js';
import { getExt } from '../path.js';
import { LintResult } from '../../types/HublValidation.js';

export async function lint(
  accountId: number,
  filepath: string,
  callback?: (lintResult: LintResult) => number
): Promise<Array<Partial<LintResult>> | void> {
  const stats = await fs.stat(filepath);
  const files = stats.isDirectory() ? await walk(filepath) : [filepath];
  if (!(files && files.length)) {
    return [];
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
        const { data: validation } = await validateHubl(accountId, source);
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
