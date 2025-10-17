import { http } from '../http/index.js';
import { Validation, HublValidationOptions } from '../types/HublValidation.js';
import { HubSpotPromise } from '../types/Http.js';

const HUBL_VALIDATE_API_PATH = 'cos-rendering/v1/internal/validate';

export function validateHubl(
  accountId: number,
  sourceCode: string,
  hublValidationOptions?: HublValidationOptions
): HubSpotPromise<Validation> {
  return http.post<Validation>(accountId, {
    url: HUBL_VALIDATE_API_PATH,
    data: {
      template_source: sourceCode,
      ...hublValidationOptions,
    },
  });
}
