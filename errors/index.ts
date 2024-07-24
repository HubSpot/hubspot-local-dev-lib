import { HubSpotHttpError } from '../models/HubSpotHttpError';
import { BaseError } from '../types/Error';
import { FileSystemError } from '../models/FileSystemError';

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

export function isAuthError(err: unknown): err is HubSpotHttpError {
  return (
    isSpecifiedError(err, { statusCode: 401 }) ||
    isSpecifiedError(err, { statusCode: 403 })
  );
}

export function isApiUploadValidationError(
  err: unknown
): err is HubSpotHttpError {
  return (
    isSpecifiedError(err, { statusCode: 400 }) &&
    !!(err?.data?.message || !!err.data?.errors)
  );
}

export function isHubSpotHttpError(error?: unknown): error is HubSpotHttpError {
  return !!error && error instanceof HubSpotHttpError;
}

export function isSystemError(err: unknown): err is BaseError {
  return (
    err instanceof Error &&
    'errno' in err &&
    err.errno != null &&
    'code' in err &&
    err.code != null &&
    'syscall' in err &&
    err.syscall != null
  );
}

export function isFileSystemError(err: unknown): err is FileSystemError {
  return err instanceof FileSystemError;
}

export function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return `${error}`;
  }

  const messages = error.name !== 'Error' ? [`${error.name}:`] : [];

  if (error.message) {
    messages.push(error.message);
  }

  if ('reason' in error && error.reason) {
    messages.push(`${error.reason}`);
  }

  console.log(messages);
  return messages.join(' ');
}
