import { HubSpotAuthError } from '../models/HubSpotAuthError';
import { i18n } from '../utils/lang';

import { HubSpotHttpErrorContext, BaseError } from '../types/Error';
import { isHubSpotHttpError } from './apiErrors';

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

/**
 * @throws
 */
export function throwError(
  error: unknown,
  context: HubSpotHttpErrorContext = {}
): never {
  if (!(error instanceof Error)) {
    // TODO: Give this an actual error message
    throw new Error('', { cause: error });
  }
  if (isHubSpotHttpError(error)) {
    if (context) {
      error.context = { ...error.context, ...context };
    }
    throw error;
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
