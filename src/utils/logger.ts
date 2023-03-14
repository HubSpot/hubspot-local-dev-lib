import { i18n } from './lang';
import { LogCallbacks } from '../types/LogCallbacks';

export function log<T extends string>(
  key: T,
  callbacks?: LogCallbacks<T>,
  debugKey?: string,
  debugInterpolation?: { [key: string]: string }
): void {
  if (callbacks && callbacks[key]) {
    callbacks[key]();
  } else if (debugKey) {
    debug(debugKey, debugInterpolation);
  }
}

export function debug(
  identifier: string,
  interpolation?: { [key: string]: string }
): void {
  console.debug(i18n(`debug.${identifier}`, interpolation));
}
