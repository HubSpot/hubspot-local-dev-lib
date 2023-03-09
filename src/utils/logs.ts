import { LogCallbacks } from '../types/LogCallbacks';

export function log<T extends string>(
  key: T,
  callbacks?: LogCallbacks<T>
): void {
  if (callbacks && callbacks[key]) {
    callbacks[key]();
  }
}
