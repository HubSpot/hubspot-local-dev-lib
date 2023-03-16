import { throwErrorWithMessage } from './standardErrors';
import { ValueOf } from '../types/Utils';
import { BaseError } from '../types/Error';
const i18nKey = 'errorTypes.cmsFields';

export const FieldErrors = {
  IsNotFunction: 'IsNotFunction',
  DoesNotReturnArray: 'DoesNotReturnArray',
} as const;

export function throwFieldsJsError(
  e: BaseError | ValueOf<typeof FieldErrors>,
  path: string,
  info: { returned?: string } = {}
) {
  if (
    e instanceof SyntaxError ||
    (typeof e === 'object' && e.code === 'MODULE_NOT_FOUND')
  ) {
    throwErrorWithMessage(`${i18nKey}.fieldsJsSyntaxError`, { path });
  }
  if (e === FieldErrors.IsNotFunction) {
    throwErrorWithMessage(`${i18nKey}.fieldsJsNotFunction`, {
      path,
      returned: info.returned || '',
    });
  }
  if (e === FieldErrors.DoesNotReturnArray) {
    throwErrorWithMessage(`${i18nKey}.fieldsJsNotReturnArray`, {
      path,
      returned: info.returned || '',
    });
  }
  if (typeof e === 'object' && e.code === 'ENOENT') {
    throwErrorWithMessage(`${i18nKey}.invalidPath`, { path });
  }
}
