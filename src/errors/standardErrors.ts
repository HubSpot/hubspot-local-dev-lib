import { HubSpotAuthError } from './HubSpotAuthError';
import { ErrorContext } from '../types/Error';
import { debug } from '../utils/logger';
import { i18n } from '../utils/lang';

import { BaseError, SystemError, StatusCodeError } from '../types/Error';

export function isSystemError(err: BaseError): boolean {
  return err.errno != null && err.code != null && err.syscall != null;
}

export function isFatalError(err: BaseError): boolean {
  return err instanceof HubSpotAuthError;
}

export function debugErrorAndContext(
  error: BaseError,
  context?: ErrorContext
): void {
  if (error.name === 'StatusCodeError') {
    const { statusCode, message, response } = error as StatusCodeError;
    debug('standardErrors.error', {
      error: JSON.stringify({
        statusCode,
        message,
        url: response.request.href,
        method: response.request.method,
        response: response.body,
        headers: response.headers,
      }),
    });
  } else {
    debug('standardErrors.error', { error: JSON.stringify(error) });
  }
  debug('standardErrors.context', { context: JSON.stringify(context) });
}

export function throwErrorWithMessage(
  identifier: string,
  interpolation?: { [key: string]: string | number }
): never {
  throw new Error(i18n(`errors.${identifier}`, interpolation));
}

function throwSystemError(error: SystemError, context?: ErrorContext): never {
  debugErrorAndContext(error, context);
  throwErrorWithMessage('errorTypes.standard.system', {
    message: error.message,
  });
}

// formally logErrorInstance
export function throwError(error: BaseError, context?: ErrorContext): never {
  debugErrorAndContext(error, context);

  if (isSystemError(error)) {
    throwSystemError(error as SystemError, context);
  } else {
    // Error or Error subclass
    const name = error.name || 'Error';
    const message = [i18n('errors.errorTypes.standard.generic', { name })];
    [error.message, error.reason].forEach(msg => {
      if (msg) {
        message.push(msg);
      }
    });
    throw new Error(message.join(' '));
  }
}
