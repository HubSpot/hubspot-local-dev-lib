import { AxiosError } from 'axios';
import {
  GenericError,
  AxiosErrorContext,
  BaseError,
  ValidationError,
} from '../types/Error';
import { HTTP_METHOD_VERBS, HTTP_METHOD_PREPOSITIONS } from '../constants/api';
import { i18n } from '../utils/lang';
import { throwError } from './standardErrors';
import { HubSpotAuthError } from '../models/HubSpotAuthError';
import { HttpMethod } from '../types/Api';

const i18nKey = 'errors.apiErrors';

export function isSpecifiedError(
  err: Error | AxiosError,
  {
    statusCode,
    category,
    subCategory,
    errorType,
    code,
  }: {
    statusCode?: number;
    category?: string;
    subCategory?: string;
    errorType?: string;
    code?: string;
  }
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error = (err && (err.cause as AxiosError<any>)) || err;
  const statusCodeErr = !statusCode || error.response?.status === statusCode;
  const categoryErr = !category || error.response?.data?.category === category;
  const subCategoryErr =
    !subCategory || error.response?.data?.subCategory === subCategory;
  const errorTypeErr =
    !errorType || error.response?.data?.errorType === errorType;
  const codeError = !code || error.code === code;

  return (
    error.isAxiosError &&
    statusCodeErr &&
    categoryErr &&
    subCategoryErr &&
    errorTypeErr &&
    codeError
  );
}

export function isMissingScopeError(err: Error | AxiosError): boolean {
  return isSpecifiedError(err, { statusCode: 403, category: 'MISSING_SCOPES' });
}

export function isGatingError(err: Error | AxiosError): boolean {
  return isSpecifiedError(err, { statusCode: 403, category: 'GATED' });
}

export function isTimeoutError(err: Error | AxiosError): boolean {
  return isSpecifiedError(err, { code: 'ETIMEDOUT' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isApiUploadValidationError(err: AxiosError<any>): boolean {
  return (
    err.isAxiosError &&
    (err.status === 400 || err.response?.status === 400) &&
    !!err.response &&
    !!(err.response?.data?.message || !!err.response?.data?.errors)
  );
}

export function isSpecifiedHubSpotAuthError(
  err: GenericError,
  { status, category, subCategory }: Partial<HubSpotAuthError>
): boolean {
  const statusCodeErr = !status || err.status === status;
  const categoryErr = !category || err.category === category;
  const subCategoryErr = !subCategory || err.subCategory === subCategory;
  return Boolean(
    err.name === 'HubSpotAuthError' &&
      statusCodeErr &&
      categoryErr &&
      subCategoryErr
  );
}

export function parseValidationErrors(
  responseData: {
    errors?: Array<ValidationError>;
    message?: string;
  } = { errors: [], message: '' }
): Array<string> {
  const errorMessages = [];

  const { errors, message } = responseData;

  if (message) {
    errorMessages.push(message);
  }

  if (errors) {
    const specificErrors = errors.map(error => {
      let errorMessage = error.message;
      if (error.errorTokens && error.errorTokens.line) {
        errorMessage = `line ${error.errorTokens.line}: ${errorMessage}`;
      }
      return errorMessage;
    });
    errorMessages.push(...specificErrors);
  }

  return errorMessages;
}

/**
 * @throws
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function throwValidationError(error: AxiosError<any>) {
  const validationErrorMessages = parseValidationErrors(error?.response?.data);
  if (validationErrorMessages.length) {
    return new Error(validationErrorMessages.join(' '), { cause: error });
  }
}

export function getAxiosErrorWithContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: AxiosError<any>,
  context: AxiosErrorContext = {}
): Error {
  const status = error.response?.status;
  const method = error.config?.method as HttpMethod;
  const { projectName } = context;

  let messageDetail: string;

  if (context.accountId) {
    const action =
      (method && HTTP_METHOD_VERBS[method]) || HTTP_METHOD_VERBS.get;

    const preposition =
      (method && HTTP_METHOD_PREPOSITIONS[method]) ||
      HTTP_METHOD_PREPOSITIONS.get;

    const requestName = context.request
      ? `${action} ${preposition} '${context.request}'`
      : action;

    messageDetail = i18n(`${i18nKey}.messageDetail`, {
      accountId: context.accountId,
      requestName,
    });
  } else {
    messageDetail = i18n(`${i18nKey}.genericMessageDetail`);
  }

  const errorMessage: Array<string> = [];

  if ((method === 'put' || method === 'post') && context.payload) {
    errorMessage.push(
      i18n(`${i18nKey}.unableToUpload`, { payload: context.payload })
    );
  }
  const isProjectMissingScopeError =
    isMissingScopeError(error) && !!projectName;
  const isProjectGatingError = isGatingError(error) && !!projectName;

  switch (status) {
    case 400:
      errorMessage.push(i18n(`${i18nKey}.codes.400`, { messageDetail }));
      break;
    case 401:
      errorMessage.push(i18n(`${i18nKey}.codes.401`, { messageDetail }));
      break;
    case 403:
      if (isProjectMissingScopeError) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.403ProjectMissingScope`, {
            accountId: context.accountId || '',
          })
        );
      } else if (isProjectGatingError) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.403ProjectGating`, {
            accountId: context.accountId || '',
          })
        );
      } else {
        errorMessage.push(i18n(`${i18nKey}.codes.403`, { messageDetail }));
      }
      break;
    case 404:
      errorMessage.push(i18n(`${i18nKey}.codes.404`, { messageDetail }));
      break;
    case 429:
      errorMessage.push(i18n(`${i18nKey}.codes.429`, { messageDetail }));
      break;
    case 503:
      errorMessage.push(i18n(`${i18nKey}.codes.503`, { messageDetail }));
      break;
    default:
      if (status && status >= 500 && status < 600) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.500Generic`, { messageDetail })
        );
      } else if (status && status >= 400 && status < 500) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.400Generic`, { messageDetail })
        );
      } else {
        errorMessage.push(i18n(`${i18nKey}.codes.generic`, { messageDetail }));
      }
      break;
  }

  if (error?.response?.data) {
    const { message, errors } = error.response.data;

    if (message && !isProjectMissingScopeError && !isProjectGatingError) {
      errorMessage.push(message);
    }

    if (errors) {
      errors.forEach((err: BaseError) => {
        if (err.message) {
          errorMessage.push('\n- ' + err.message);
        }
      });
    }
  }

  return new Error(errorMessage.join(' '), { cause: error });
}

/**
 * @throws
 */
export function throwApiError(
  error: AxiosError,
  context: AxiosErrorContext = {}
): never {
  if (error.isAxiosError) {
    throw getAxiosErrorWithContext(error, context);
  }
  throwError(error);
}

export function throwApiUploadError(
  error: AxiosError,
  context: AxiosErrorContext = {}
): never {
  if (isApiUploadValidationError(error)) {
    throwValidationError(error);
  }
  throwApiError(error, context);
}
