import { i18n } from './lang';
import { LogCallbacks } from '../types/LogCallbacks';
import { DebugLangKey, CustomLoggerPrimaryLangKey } from '../types/Lang';

export function log<T extends string>(
  key: T,
  callbacks: LogCallbacks<T> | undefined,
  debugKey: DebugLangKey,
  debugInterpolation?: { [key: string]: string | number }
): void {
  if (callbacks && callbacks[key]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    callbacks[key]!();
  } else if (debugKey) {
    debug(debugKey, debugInterpolation);
  }
}

export function makeTypedLogger<
  T extends readonly string[],
  const PrimaryKey extends CustomLoggerPrimaryLangKey
>(callbacks: LogCallbacks<T[number]> | undefined, debugKey: PrimaryKey) {
  type ValidateCallbackKeys = T[number];

  type SecondaryKey<PK extends PrimaryKey> =
    DebugLangKey extends `${PK}.${infer SecondaryKey}` ? SecondaryKey : never;

  return function (
    key: SecondaryKey<PrimaryKey>,
    debugInterpolation?: { [key: string]: string | number }
  ) {
    log<ValidateCallbackKeys>(
      key,
      callbacks,
      `${debugKey}.${key}`,
      debugInterpolation
    );
  };
}

export function debug(
  identifier: DebugLangKey,
  interpolation?: { [key: string]: string | number }
): void {
  console.debug(i18n(`debug.${identifier}`, interpolation));
}
