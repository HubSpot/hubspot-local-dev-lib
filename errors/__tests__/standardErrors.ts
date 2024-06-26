import {
  isSystemError,
  isFatalError,
  throwErrorWithMessage,
  throwAuthErrorWithMessage,
  throwError,
} from '../standardErrors';
import { BaseError } from '../../types/Error';
import { HubSpotAuthError } from '../../models/HubSpotAuthError';
import { AxiosError } from 'axios';

export const newError = (overrides = {}): BaseError => {
  return {
    name: 'Error',
    message: 'An error ocurred',
    errno: 1,
    code: 'error_code',
    syscall: 'error_syscall',
    errors: [],
    ...overrides,
  };
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
      const cause = newError() as AxiosError<{
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
      const error = newError();
      expect(() =>
        throwErrorWithMessage('errors.generic', {}, error)
      ).toThrow();
    });
  });

  describe('throwAuthErrorWithMessage()', () => {
    it('throws auth error with message', () => {
      const error = newError() as AxiosError;
      expect(() =>
        throwAuthErrorWithMessage('errors.generic', {}, error)
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
