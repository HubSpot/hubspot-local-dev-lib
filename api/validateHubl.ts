import http from '../http';
import { Validation, HublValidationOptions } from '../types/HublValidation';

const HUBL_VALIDATE_API_PATH = 'cos-rendering/v1/internal/validate';

export async function validateHubl(
  accountId: number,
  sourceCode: string,
  hublValidationOptions?: HublValidationOptions
): Promise<Validation> {
  return http.post(accountId, {
    url: HUBL_VALIDATE_API_PATH,
    body: {
      template_source: sourceCode,
      ...hublValidationOptions,
    },
  });
}
