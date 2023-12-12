import {
  GenericError,
  StatusCodeError,
  StatusCodeErrorContext,
} from '../types/Error';
import { HTTP_METHOD_VERBS, HTTP_METHOD_PREPOSITIONS } from '../constants/api';
import { i18n } from '../utils/lang';
import { throwError } from './standardErrors';
import { HubSpotAuthError } from '../models/HubSpotAuthError';

const i18nKey = 'errors.apiErrors';

export function isApiStatusCodeError(err: GenericError): boolean {
  return (
    err.name === 'StatusCodeError' ||
    (!!err.status && err.status >= 100 && err.status < 600)
  );
}

export function isMissingScopeError(err: GenericError): boolean {
  return (
    isApiStatusCodeError(err) &&
    err.status === 403 &&
    !!err.error &&
    err.error.category === 'MISSING_SCOPES'
  );
}

export function isGatingError(err: GenericError): boolean {
  return (
    isApiStatusCodeError(err) &&
    err.status === 403 &&
    !!err.error &&
    err.error.category === 'GATED'
  );
}

export function isApiUploadValidationError(err: GenericError): boolean {
  return (
    isApiStatusCodeError(err) &&
    err.status === 400 &&
    !!err.response &&
    !!err.response.body &&
    !!(err.response.body.message || !!err.response.body.errors)
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
  responseBody: {
    errors?: Array<StatusCodeError>;
    message?: string;
  } = { errors: [], message: '' }
) {
  const errorMessages = [];

  const { errors, message } = responseBody;

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

function logValidationErrors(error: StatusCodeError) {
  const { response = { body: undefined } } = error;
  const validationErrorMessages = parseValidationErrors(response.body);
  if (validationErrorMessages.length) {
    throwError(new Error(validationErrorMessages.join(' '), { cause: error }));
  }
}

/**
 * @throws
 */
export function throwApiStatusCodeError(
  error: StatusCodeError,
  context: StatusCodeErrorContext = {}
): never {
  const { status } = error;
  const { method } = error.options || {};
  const { projectName } = context;

  const isPutOrPost = method === 'PUT' || method === 'POST';
  const action =
    method && (HTTP_METHOD_VERBS[method] || HTTP_METHOD_VERBS.DEFAULT);
  const preposition =
    (method && HTTP_METHOD_PREPOSITIONS[method]) ||
    HTTP_METHOD_PREPOSITIONS.DEFAULT;

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
    error?.error?.message &&
    !isProjectMissingScopeError &&
    !isProjectGatingError
  ) {
    errorMessage.push(error.error.message);
  }
  if (error.error && error.error.errors) {
    error.error.errors.forEach(err => {
      errorMessage.push('\n- ' + err.message);
    });
  }
  throwError(new Error(errorMessage.join(' '), { cause: error }));
}

/**
 * @throws
 */
export function throwApiError(
  error: StatusCodeError,
  context: StatusCodeErrorContext = {}
): never {
  if (isApiStatusCodeError(error)) {
    throwApiStatusCodeError(error, context);
  }
  throwError(error);
}

/**
 * @throws
 */
export function throwApiUploadError(
  error: StatusCodeError,
  context: StatusCodeErrorContext = {}
): never {
  if (isApiUploadValidationError(error)) {
    logValidationErrors(error);
  }
  throwApiError(error, context);
}
