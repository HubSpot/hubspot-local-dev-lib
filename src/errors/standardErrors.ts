import HubSpotAuthError from './HubSpotAuthError';
import { ErrorContext } from '../types/Error';

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
    console.debug('Error: %o', {
      statusCode,
      message,
      url: response.request.href,
      method: response.request.method,
      response: response.body,
      headers: response.headers,
    });
  } else {
    console.debug('Error: %o', error);
  }
  console.debug('Context: %o', context);
}

function throwSystemError(error: SystemError, context?: ErrorContext): never {
  debugErrorAndContext(error, context);
  throw new Error(`A system error has occurred: ${error.message}`);
}

// formally logErrorInstance
export function throwError(error: BaseError, context?: ErrorContext): never {
  debugErrorAndContext(error, context);

  if (isSystemError(error)) {
    throwSystemError(error as SystemError, context);
  } else {
    // Error or Error subclass
    const name = error.name || 'Error';
    const message = [`A ${name} has occurred.`];
    [error.message, error.reason].forEach(msg => {
      if (msg) {
        message.push(msg);
      }
    });
    throw new Error(message.join(' '));
  }
}
