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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isMissingScopeError(err: AxiosError<any>): boolean {
  return (
    err.isAxiosError &&
    err.status === 403 &&
    !!err.response &&
    err.response.data.category === 'MISSING_SCOPES'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isGatingError(err: AxiosError<any>): boolean {
  return (
    err.isAxiosError &&
    err.status === 403 &&
    !!err.response &&
    err.response.data.category === 'GATED'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isApiUploadValidationError(err: AxiosError<any>): boolean {
  return (
    err.isAxiosError &&
    err.status === 400 &&
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

function parseValidationErrors(
  responseData: {
    errors?: Array<ValidationError>;
    message?: string;
  } = { errors: [], message: '' }
) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logValidationErrors(error: AxiosError<any>) {
  const validationErrorMessages = parseValidationErrors(error?.response?.data);
  if (validationErrorMessages.length) {
    throwError(new Error(validationErrorMessages.join(' '), { cause: error }));
  }
}

/**
 * @throws
 */
export function throwAxiosErrorWithContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: AxiosError<any>,
  context: AxiosErrorContext = {}
): never {
  const { status } = error;
  const method = error.config?.method as HttpMethod;
  const { projectName } = context;

  const isPutOrPost = method === 'put' || method === 'post';
  const action = method && (HTTP_METHOD_VERBS[method] || HTTP_METHOD_VERBS.get);
  const preposition =
    (method && HTTP_METHOD_PREPOSITIONS[method]) ||
    HTTP_METHOD_PREPOSITIONS.get;

  const request = context.request
    ? `${action} ${preposition} "${context.request}"`
    : action;
  const messageDetail =
    request && context.accountId
      ? i18n(`${i18nKey}.messageDetail`, {
          request,
          accountId: context.accountId,
        })
      : 'request';

  const errorMessage: Array<string> = [];
  if (isPutOrPost && context.payload) {
    errorMessage.push(
      i18n(`${i18nKey}.unableToUpload`, { payload: context.payload })
    );
  }
  const isProjectMissingScopeError = isMissingScopeError(error) && projectName;
  const isProjectGatingError = isGatingError(error) && projectName;
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
          i18n(`${i18nKey}.codes.403MissingScope`, {
            accountId: context.accountId || '',
          })
        );
      } else if (isProjectGatingError) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.403Gating`, {
            accountId: context.accountId || '',
          })
        );
      } else {
        errorMessage.push(i18n(`${i18nKey}.codes.403`, { messageDetail }));
      }
      break;
    case 404:
      if (context.request) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.404Request`, {
            action: action || 'request',
            request: context.request,
            account: context.accountId || '',
          })
        );
      } else {
        errorMessage.push(i18n(`${i18nKey}.codes.404`, { messageDetail }));
      }
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
  if (
    error?.response?.data?.message &&
    !isProjectMissingScopeError &&
    !isProjectGatingError
  ) {
    errorMessage.push(error.response.data.message);
  }
  if (error?.response?.data?.errors) {
    error.response.data.errors.forEach((err: BaseError) => {
      errorMessage.push('\n- ' + err.message);
    });
  }
  throwError(new Error(errorMessage.join(' '), { cause: error }));
}

/**
 * @throws
 */
export function throwApiError(
  error: AxiosError,
  context: AxiosErrorContext = {}
): never {
  if (error.isAxiosError) {
    throwAxiosErrorWithContext(error, context);
  }
  throwError(error);
}

/**
 * @throws
 */
export function throwApiUploadError(
  error: AxiosError,
  context: AxiosErrorContext = {}
): never {
  if (isApiUploadValidationError(error)) {
    logValidationErrors(error);
  }
  throwApiError(error, context);
}
