/* eslint-disable @typescript-eslint/no-explicit-any */

import path from 'path';
import fs from 'fs';
import semver from 'semver';
import { pathToFileURL } from 'url';
import { getExt } from '../path';
import { FieldsJs } from './handleFieldsJS';
import { i18n } from '../../utils/lang';

const i18nKey = 'lib.cms.processFieldsJs';

const { dirName, fieldOptions, filePath, writeDir } = process.env;
const baseName = path.basename(filePath!);

//TODO - Figure out agnostic logging
console.info(
  i18n(`${i18nKey}.converting`, {
    src: dirName + `/${baseName}`,
    dest: dirName + '/fields.json',
  })
);

/*
 * How this works: dynamicImport() will always return either a Promise or undefined.
 * In the case when it's a Promise, its expected that it will resolve to a function.
 * This function has optional return type of Promise<Array> | Array. In order to have uniform handling,
 * we wrap the return value of the function in a Promise.resolve(), and then process.
 */

const fieldsPromise = dynamicImport(filePath!).catch(e => {
  throw e;
});

fieldsPromise.then(fieldsFunc => {
  const fieldsFuncType = typeof fieldsFunc;
  if (fieldsFuncType !== 'function') {
    throw new Error(
      i18n(`${i18nKey}.errors.notFunction`, {
        path: filePath!,
        returned: fieldsFuncType,
      })
    );
  }
  return Promise.resolve(fieldsFunc(fieldOptions)).then(fields => {
    if (!Array.isArray(fields)) {
      throw new Error(
        i18n(`${i18nKey}.errors.notArray`, {
          path: filePath!,
          returned: typeof fields,
        })
      );
    }

    const finalPath = path.join(writeDir!, '/fields.json');

    return fieldsArrayToJson(fields).then(json => {
      if (!fs.existsSync(writeDir!)) {
        fs.mkdirSync(writeDir!, { recursive: true });
      }
      fs.writeFileSync(finalPath, json);

      //TODO - Figure out agnostic logging
      console.log(
        i18n(`${i18nKey}.converted`, {
          src: dirName + `/${baseName}`,
          dest: dirName + '/fields.json',
        })
      );
      if (process) {
        process.send!({
          action: 'COMPLETE',
          finalPath,
        });
      }
    });
  });
});

/*
 * Polyfill for `Array.flat(Infinity)` since the `flat` is only available for Node v11+
 * https://stackoverflow.com/a/15030117
 */
function flattenArray(arr: Array<any>): Array<any> {
  return arr.reduce((flat, toFlatten) => {
    return flat.concat(
      Array.isArray(toFlatten) ? flattenArray(toFlatten) : toFlatten
    );
  }, []);
}

async function fieldsArrayToJson(fields: Array<FieldsJs>): Promise<string> {
  const allFields = await Promise.all(flattenArray(fields));
  const jsonFields = allFields.map(field => {
    return typeof field['toJSON'] === 'function' ? field.toJSON() : field;
  });
  return JSON.stringify(jsonFields, null, 2);
}

/**
 * Takes in a path to a javascript file and either dynamically imports it or requires it, and returns, depending on node version.
 * @param {string} filePath - Path to javascript file
 * @returns {Promise | undefined} - Returns _default_ exported content if ESM, or exported module content if CJS, or undefined if node version < 13.2 and file is .mjs.
 */
async function dynamicImport(filePath: string): Promise<any> {
  if (semver.gte(process.version, '13.2.0')) {
    const exported = await new Function(
      `return import("${pathToFileURL(filePath)}")`
    )();
    return exported.default;
  } else {
    if (getExt(filePath) == 'mjs') {
      throw new Error(i18n(`${i18nKey}.errors.invalidMjsFile`));
    }
    return require(filePath);
  }
}
