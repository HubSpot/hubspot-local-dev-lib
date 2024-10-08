import { AxiosPromise } from 'axios';
import { http } from '../http';
import { Validation, HublValidationOptions } from '../types/HublValidation';

const HUBL_VALIDATE_API_PATH = 'cos-rendering/v1/internal/validate';

export function validateHubl(
  accountId: number,
  sourceCode: string,
  hublValidationOptions?: HublValidationOptions
): AxiosPromise<Validation> {
  return http.post<Validation>(accountId, {
    url: HUBL_VALIDATE_API_PATH,
    data: {
      template_source: sourceCode,
      ...hublValidationOptions,
    },
  });
}
