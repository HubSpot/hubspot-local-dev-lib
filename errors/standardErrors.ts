import { HubSpotAuthError } from '../models/HubSpotAuthError';
import { i18n } from '../utils/lang';
import { throwStatusCodeError } from './apiErrors';

import { BaseError, StatusCodeError } from '../types/Error';
import { LangKey } from '../types/Lang';

export function isSystemError(err: BaseError): boolean {
  return err.errno != null && err.code != null && err.syscall != null;
}

export function isFatalError(err: BaseError): boolean {
  return err instanceof HubSpotAuthError;
}

function genericThrowErrorWithMessage(
  ErrorType: ErrorConstructor,
  identifier: LangKey,
  interpolation?: { [key: string]: string | number },
  cause?: BaseError
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
  cause?: BaseError
): never {
  genericThrowErrorWithMessage(Error, identifier, interpolation, cause);
}

/**
 * @throws
 */
export function throwTypeErrorWithMessage(
  identifier: LangKey,
  interpolation?: { [key: string]: string | number },
  cause?: BaseError
): never {
  genericThrowErrorWithMessage(TypeError, identifier, interpolation, cause);
}

/**
 * @throws
 */
export function throwAuthErrorWithMessage(
  identifier: LangKey,
  interpolation?: { [key: string]: string | number },
  cause?: StatusCodeError
): never {
  genericThrowErrorWithMessage(
    // @ts-expect-error HubSpotAuthError is not callable
    HubSpotAuthError,
    identifier,
    interpolation,
    cause
  );
}

/**
 * @throws
 */
export function throwError(error: BaseError): never {
  if (error.name === 'StatusCodeError') {
    throwStatusCodeError(error as StatusCodeError);
  } else {
    // Error or Error subclass
    const name = error.name || 'Error';
    const message = [i18n('errors.generic', { name })];
    [error.message, error.reason].forEach(msg => {
      if (msg) {
        message.push(msg);
      }
    });
    throw new Error(message.join(' '), { cause: error });
  }
}
