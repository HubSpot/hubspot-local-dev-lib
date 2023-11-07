import { i18n } from './lang';
import { LogCallbacks } from '../types/LogCallbacks';
import { LangKey } from '../types/Lang';

export function log<T extends string>(
  key: T,
  callbacks?: LogCallbacks<T>,
  debugKey?: LangKey,
  debugInterpolation?: { [key: string]: string | number }
): void {
  if (callbacks && callbacks[key]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    callbacks[key]!();
  } else if (debugKey) {
    debug(debugKey, debugInterpolation);
  }
}

export function makeTypedLogger<T extends readonly string[]>(
  callbacks?: LogCallbacks<T[number]>
) {
  type ValidateCallbackKeys = T[number];

  return (
    key: ValidateCallbackKeys,
    debugKey?: LangKey,
    debugInterpolation?: { [key: string]: string | number }
  ) => log<ValidateCallbackKeys>(key, callbacks, debugKey, debugInterpolation);
}

export function debug(
  identifier: LangKey,
  interpolation?: { [key: string]: string | number }
): void {
  console.debug(i18n(identifier, interpolation));
}
