import { HubSpotAuthError } from '../models/HubSpotAuthError';
import { i18n } from '../utils/lang';

import { BaseError } from '../types/Error';
import { LangKey } from '../types/Lang';
import { AxiosError } from 'axios';

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
  cause?: BaseError | AxiosError
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
  cause?: BaseError | AxiosError
): never {
  genericThrowErrorWithMessage(Error, identifier, interpolation, cause);
}

/**
 * @throws
 */
export function throwAuthErrorWithMessage(
  identifier: LangKey,
  interpolation?: { [key: string]: string | number },
  cause?: AxiosError
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
  // Error or Error subclass
  const message =
    error.name && error.name !== 'Error'
      ? [i18n('errors.generic', { name: error.name })]
      : [];
  [error.message, error.reason].forEach(msg => {
    if (msg) {
      message.push(msg);
    }
  });
  throw new Error(message.join(' '), { cause: error });
}
