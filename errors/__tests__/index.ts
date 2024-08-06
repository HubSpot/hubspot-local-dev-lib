import {
  isMissingScopeError,
  isGatingError,
  isSpecifiedError,
  isSystemError,
} from '../index';
import { BaseError } from '../../types/Error';
import { HubSpotHttpError } from '../../models/HubSpotHttpError';

export const newError = (overrides = {}): BaseError => {
  return {
    name: 'Error',
    message: 'An error occurred',
    status: 200,
    errors: [],
    ...overrides,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const newHubSpotHttpError = (overrides: any = {}): HubSpotHttpError => {
  return new HubSpotHttpError('', {
    cause: {
      ...newError(),
      isAxiosError: true,
      name: 'HubSpotHttpError',
      response: {
        request: {
          href: 'http://example.com/',
          method: 'GET',
        },
        data: {},
        headers: {},
        status: 200,
        statusText: '',
        config: {},
      },
      ...overrides,
    },
  });
};

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

export const newSystemError = (overrides?: {
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

describe('errors/errors', () => {
  describe('isSpecifiedError()', () => {
    it('returns true for a matching specified error', () => {
      const error1 = newHubSpotHttpError({
        response: {
          status: 403,
          data: { category: 'BANNED', subCategory: 'USER_ACCESS_NOT_ALLOWED' },
        },
      });
      expect(
        isSpecifiedError(error1, {
          statusCode: 403,
          category: 'BANNED',
          subCategory: 'USER_ACCESS_NOT_ALLOWED',
        })
      ).toBe(true);
    });

    it('returns false for non matching specified errors', () => {
      const error1 = newHubSpotHttpError({
        response: {
          status: 403,
          data: { category: 'BANNED', subCategory: 'USER_ACCESS_NOT_ALLOWED' },
        },
      });
      const error2 = newHubSpotHttpError({ isAxiosError: false });
      expect(
        isSpecifiedError(error1, {
          statusCode: 400,
          category: 'GATED',
        })
      ).toBe(false);
      expect(isMissingScopeError(error2)).toBe(false);
    });
  });
  describe('isMissingScopeError()', () => {
    it('returns true for missing scope errors', () => {
      const error1 = newHubSpotHttpError({
        response: { status: 403, data: { category: 'MISSING_SCOPES' } },
      });
      expect(isMissingScopeError(error1)).toBe(true);
    });

    it('returns false for non missing scope errors', () => {
      const error1 = newHubSpotHttpError({
        response: { status: 400, data: { category: 'MISSING_SCOPES' } },
      });
      const error2 = newHubSpotHttpError({ isAxiosError: false });
      expect(isMissingScopeError(error1)).toBe(false);
      expect(isMissingScopeError(error2)).toBe(false);
    });
  });

  describe('isGatingError()', () => {
    it('returns true for gating errors', () => {
      const error1 = newHubSpotHttpError({
        response: { status: 403, data: { category: 'GATED' } },
      });
      expect(isGatingError(error1)).toBe(true);
    });

    it('returns false for non gating errors', () => {
      const error1 = newHubSpotHttpError({
        response: { status: 400, data: { category: 'GATED' } },
      });
      const error2 = newHubSpotHttpError({ isAxiosError: false });
      expect(isGatingError(error1)).toBe(false);
      expect(isGatingError(error2)).toBe(false);
    });
  });

  describe('isSystemError()', () => {
    it('returns true for system errors', () => {
      const error = newSystemError();
      expect(isSystemError(error)).toBe(true);
    });

    it('returns false for non system errors', () => {
      const error1 = newSystemError({ errno: null });
      const error2 = newSystemError({ code: null });
      const error3 = newSystemError({ syscall: null });
      expect(isSystemError(error1)).toBe(false);
      expect(isSystemError(error2)).toBe(false);
      expect(isSystemError(error3)).toBe(false);
    });
  });
});
