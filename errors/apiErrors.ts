import { HubSpotHttpErrorContext } from '../types/Error';
import { HTTP_METHOD_VERBS, HTTP_METHOD_PREPOSITIONS } from '../constants/api';
import { i18n } from '../utils/lang';
import { HubSpotAuthError } from '../models/HubSpotAuthError';
import { HttpMethod } from '../types/Api';
import { HubSpotHttpError } from '../models/HubSpotHttpError';
import { AxiosError } from 'axios';

const i18nKey = 'errors.apiErrors';

export function isSpecifiedError(
  err: unknown,
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
): err is HubSpotHttpError {
  if (!isHubSpotHttpError(err)) {
    return false;
  }

  const { data, status, code: actualCode } = err;

  const statusCodeMatchesError = !statusCode || status === statusCode;
  const categoryMatchesError = !category || data?.category === category;
  const subCategoryMatchesError =
    !subCategory || data?.subCategory === subCategory;
  const errorTypeMatchesError = !errorType || data?.errorType === errorType;
  const codeMatchesError = !code || actualCode === code;

  return (
    statusCodeMatchesError &&
    categoryMatchesError &&
    subCategoryMatchesError &&
    errorTypeMatchesError &&
    codeMatchesError
  );
}

export function isMissingScopeError(err: unknown): err is HubSpotHttpError {
  return isSpecifiedError(err, { statusCode: 403, category: 'MISSING_SCOPES' });
}

export function isGatingError(err: unknown): err is HubSpotHttpError {
  return isSpecifiedError(err, { statusCode: 403, category: 'GATED' });
}

export function isTimeoutError(err: unknown): err is HubSpotHttpError {
  return isSpecifiedError(err, { code: 'ETIMEDOUT' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isApiUploadValidationError(
  err: unknown
): err is HubSpotHttpError {
  return (
    isSpecifiedError(err, { statusCode: 400 }) &&
    !!(err?.data?.message || !!err.data?.errors)
  );
}

export function isSpecifiedHubSpotAuthError(
  err: unknown,
  { status, category, subCategory }: Partial<HubSpotAuthError>
): err is HubSpotAuthError {
  if (!err || !(err instanceof HubSpotAuthError)) {
    return false;
  }
  const statusCodeErr = !status || err.status === status;
  const categoryErr = !category || err.category === category;
  const subCategoryErr = !subCategory || err.subCategory === subCategory;
  return Boolean(statusCodeErr && categoryErr && subCategoryErr);
}

export function joinErrorMessages(
  error: AxiosError<{ message: string; errors: { message: string }[] }>,
  context: HubSpotHttpErrorContext = {}
) {
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
      errors.forEach(err => {
        if (err.message) {
          errorMessage.push('\n- ' + err.message);
        }
      });
    }
  }

  return errorMessage.join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHubSpotHttpError(error?: unknown): error is HubSpotHttpError {
  return !!error && error instanceof HubSpotHttpError;
}
