import { HubSpotAuthError } from '../models/HubSpotAuthError';
import { i18n } from '../utils/lang';

import { AxiosErrorContext, BaseError } from '../types/Error';
import { LangKey } from '../types/Lang';
import {
  getUserFriendlyHttpErrorMessage,
  isHubSpotHttpError,
} from './apiErrors';

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

export function isHubSpotAuthError(err: unknown): err is HubSpotAuthError {
  return err instanceof HubSpotAuthError;
}

function genericThrowErrorWithMessage(
  ErrorType: ErrorConstructor,
  identifier: LangKey,
  interpolation?: { [key: string]: string | number },
  cause?: unknown
): never {
  const message = i18n(identifier, interpolation);
  if (cause) {
    throw new ErrorType(message, { cause });
  }
  throw new ErrorType(message);
}

/**
 * @throws
 */
export function throwErrorWithMessage(
  identifier: LangKey,
  interpolation?: { [key: string]: string | number },
  cause?: unknown
): never {
  genericThrowErrorWithMessage(Error, identifier, interpolation, cause);
}

/**
 * @throws
 */
export function throwAuthErrorWithMessage(
  identifier: LangKey,
  interpolation?: { [key: string]: string | number },
  cause?: unknown
): never {
  const message = i18n(identifier, interpolation);
  if (cause) {
    throw new HubSpotAuthError(message, { cause });
  }
  throw new HubSpotAuthError(message);
}

/**
 * @throws
 */
export function throwError(
  error: unknown,
  context: AxiosErrorContext = {}
): never {
  if (!(error instanceof Error)) {
    throw new Error('', { cause: error });
  }
  if (isHubSpotHttpError(error)) {
    throw getUserFriendlyHttpErrorMessage(error, context);
  }

  // Error or Error subclass
  const message =
    error.name && error.name !== 'Error'
      ? [i18n('errors.generic', { name: error.name })]
      : [];

  if (error.message) {
    message.push(error.message);
  }
  if ('reason' in error && error.reason) {
    message.push(error.reason as string);
  }

  throw new Error(message.join(' '), { cause: error });
}
