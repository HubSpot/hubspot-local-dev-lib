import {
  isSystemError,
  isFatalError,
  throwErrorWithMessage,
  throwAuthErrorWithMessage,
  throwError,
} from '../standardErrors';
import { HubSpotAuthError } from '../../models/HubSpotAuthError';
import { AxiosError } from 'axios';

class FakeSystemError extends Error {
  private code?: string | null;
  private syscall?: string | null;
  private errors?: string[] | null;
  private errno?: number | null;

  constructor(
    message: string,
    options?: ErrorOptions,
    errno?: number | null,
    code?: string | null,
    syscall?: string | null,
    errors?: string[] | null
  ) {
    super(message, options);
    this.code = code;
    this.syscall = syscall;
    this.errno = errno;
    this.errors = errors;
  }
}

export const newError = (overrides?: {
  errno?: number | null;
  code?: string | null;
  syscall?: string | null;
  errors?: string[] | null;
}): FakeSystemError => {
  const defaults = {
    errno: 1,
    code: 'error_code',
    syscall: 'error_syscall',
    errors: [],
  };
  const { errno, syscall, code, errors } = { ...defaults, ...overrides };
  return new FakeSystemError(
    'An error ocurred',
    {},
    errno,
    code,
    syscall,
    errors
  );
};

describe('errors/standardErrors', () => {
  describe('isSystemError()', () => {
    it('returns true for system errors', () => {
      const error = newError();
      expect(isSystemError(error)).toBe(true);
    });

    it('returns false for non system errors', () => {
      const error1 = newError({ errno: null });
      const error2 = newError({ code: null });
      const error3 = newError({ syscall: null });
      expect(isSystemError(error1)).toBe(false);
      expect(isSystemError(error2)).toBe(false);
      expect(isSystemError(error3)).toBe(false);
    });
  });

  describe('isFatalError()', () => {
    it('returns true for fatal errors', () => {
      const cause = newError() as unknown as AxiosError<{
        category: string;
        subcategory: string;
      }>;
      const error = new HubSpotAuthError('A fatal auth error', { cause });
      expect(isFatalError(error)).toBe(true);
    });

    it('returns false for non fatal errors', () => {
      const error = newError();
      expect(isFatalError(error)).toBe(false);
    });
  });

  describe('throwErrorWithMessage()', () => {
    it('throws error with message', () => {
      expect(() =>
        throwErrorWithMessage('errors.generic', {}, new AxiosError())
      ).toThrow();
    });
  });

  describe('throwAuthErrorWithMessage()', () => {
    it('throws auth error with message', () => {
      expect(() =>
        throwAuthErrorWithMessage('errors.generic', {}, new AxiosError())
      ).toThrow();
    });
  });

  describe('throwError()', () => {
    it('throws error', () => {
      const error = newError();
      expect(() => throwError(error)).toThrow();
    });
  });
});
