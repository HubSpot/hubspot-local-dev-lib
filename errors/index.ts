import { isAxiosError } from 'axios';
import {
  HubSpotHttpError,
  HubSpotHttpErrorName,
} from '../models/HubSpotHttpError.js';
import {
  FilerSystemErrorName,
  FileSystemError,
} from '../models/FileSystemError.js';
import { HubSpotConfigError } from '../models/HubSpotConfigError.js';

export { isSystemError } from './isSystemError.js';

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

export function isValidationError(err: unknown): err is HubSpotHttpError {
  return (
    isHubSpotHttpError(err) &&
    isSpecifiedError(err, { statusCode: 400 }) &&
    !!(err?.data?.message || !!err.data?.errors)
  );
}

export function isHubSpotHttpError(error?: unknown): error is HubSpotHttpError {
  return (
    !!error && error instanceof Error && error.name === HubSpotHttpErrorName
  );
}

// GitHub error guards accept both a raw error and one wrapped via
// `new Error(message, { cause })`, because this library re-throws GitHub
// failures wrapped that way (see lib/github.ts). They also handle both
// HubSpotHttpError and raw AxiosError shapes so consumers don't have to.
export function isGithubRateLimitError(err: unknown): boolean {
  return (
    hasGithubRateLimitSignal(err) ||
    (err instanceof Error && hasGithubRateLimitSignal(err.cause))
  );
}

function hasGithubRateLimitSignal(err: unknown): boolean {
  if (isHubSpotHttpError(err)) {
    return (
      !!err.headers &&
      err.headers['x-ratelimit-remaining'] === '0' &&
      'x-github-request-id' in err.headers
    );
  }
  if (isAxiosError(err)) {
    const headers = err.response?.headers;
    return (
      !!headers &&
      String(headers['x-ratelimit-remaining']) === '0' &&
      'x-github-request-id' in headers
    );
  }
  return false;
}

export function isGithubError(err: unknown): boolean {
  return (
    hasGithubErrorSignal(err) ||
    (err instanceof Error && hasGithubErrorSignal(err.cause))
  );
}

function hasGithubErrorSignal(err: unknown): boolean {
  if (isHubSpotHttpError(err)) {
    return !!err.headers && 'x-github-request-id' in err.headers;
  }
  if (isAxiosError(err)) {
    const headers = err.response?.headers;
    if (headers && 'x-github-request-id' in headers) {
      return true;
    }
    const url = err.config?.url;
    return (
      typeof url === 'string' &&
      (url.includes('github.com') || url.includes('githubusercontent.com'))
    );
  }
  return false;
}

// Extracts the HTTP status from HubSpotHttpError or AxiosError, unwrapping a
// wrapped `cause` so consumers can classify failures without knowing whether
// the error was re-thrown by this library.
export function getHttpStatusFromError(err: unknown): number | undefined {
  const status = getStatusCode(err);
  if (status !== undefined) {
    return status;
  }
  return err instanceof Error ? getStatusCode(err.cause) : undefined;
}

function getStatusCode(err: unknown): number | undefined {
  if (isHubSpotHttpError(err)) {
    return err.status;
  }
  if (isAxiosError(err)) {
    return err.status ?? err.response?.status;
  }
  return undefined;
}

export function isFileSystemError(err: unknown): err is FileSystemError {
  return err instanceof Error && err.name === FilerSystemErrorName;
}

export function isHubSpotConfigError(err: unknown): err is HubSpotConfigError {
  return err instanceof HubSpotConfigError;
}
