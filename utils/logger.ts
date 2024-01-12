import { i18n } from './lang';
import { logger } from '../lib/logging/logger';
import { LogCallbacks } from '../types/LogCallbacks';
import { InterpolationData, LangKey } from '../types/Lang';

export function log<T extends string>(
  key: T,
  callbacks?: LogCallbacks<T>,
  debugKey?: LangKey,
  interpolationData?: InterpolationData
): void {
  if (callbacks && callbacks[key]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    callbacks[key]!(interpolationData);
  } else if (debugKey) {
    debug(debugKey, interpolationData);
  }
}

export function makeTypedLogger<T extends readonly string[]>(
  callbacks?: LogCallbacks<T[number]>
) {
  type ValidateCallbackKeys = T[number];

  return (
    key: ValidateCallbackKeys,
    debugKey?: LangKey,
    interpolationData?: InterpolationData
  ) => log<ValidateCallbackKeys>(key, callbacks, debugKey, interpolationData);
}

export function debug(
  identifier: LangKey,
  interpolationData?: InterpolationData
): void {
  logger.debug(i18n(identifier, interpolationData));
}
