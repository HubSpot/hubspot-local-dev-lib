import { FieldsArray } from '../../types/FieldsJS.js';

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
