import { AxiosError } from 'axios';
import {
  isMissingScopeError,
  isGatingError,
  isSpecifiedError,
  isSystemError,
  isGithubError,
  isGithubRateLimitError,
  getHttpStatusFromError,
} from '../index.js';
import { BaseError } from '../../types/Error.js';
import { HubSpotHttpError } from '../../models/HubSpotHttpError.js';

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

  describe('isGithubError()', () => {
    it('returns true for a HubSpotHttpError with a GitHub request id header', () => {
      const error = newHubSpotHttpError({
        response: { status: 200, headers: { 'x-github-request-id': 'ABC' } },
      });
      expect(isGithubError(error)).toBe(true);
    });

    it('returns true for an AxiosError with a GitHub request id response header', () => {
      const error = Object.assign(new AxiosError('Request failed'), {
        response: { status: 403, headers: { 'x-github-request-id': 'ABC' } },
      });
      expect(isGithubError(error)).toBe(true);
    });

    it('returns true for an AxiosError whose request URL is a GitHub host', () => {
      const error = Object.assign(new AxiosError('Network Error'), {
        config: {
          url: 'https://api.github.com/repos/HubSpot/example/zipball/main',
        },
      });
      expect(isGithubError(error)).toBe(true);
    });

    it('returns false for a non-GitHub HubSpotHttpError', () => {
      const error = newHubSpotHttpError({
        response: { status: 403, headers: {} },
      });
      expect(isGithubError(error)).toBe(false);
    });

    it('returns false for a non-GitHub AxiosError', () => {
      const error = Object.assign(new AxiosError('Server error'), {
        response: { status: 500, headers: {} },
        config: { url: 'https://api.hubapi.com/foo' },
      });
      expect(isGithubError(error)).toBe(false);
    });

    it('returns true when the GitHub error is wrapped in error.cause', () => {
      const cause = Object.assign(new AxiosError('Request failed'), {
        response: { status: 403, headers: { 'x-github-request-id': 'ABC' } },
      });
      const wrapped = new Error('An error occurred fetching the source.', {
        cause,
      });
      expect(isGithubError(wrapped)).toBe(true);
    });

    it('returns false for a plain error', () => {
      expect(isGithubError(new Error('nope'))).toBe(false);
    });

    it('returns false for null or undefined', () => {
      expect(isGithubError(null)).toBe(false);
      expect(isGithubError(undefined)).toBe(false);
    });
  });

  describe('isGithubRateLimitError()', () => {
    it('returns true for a HubSpotHttpError with rate-limit headers', () => {
      const error = newHubSpotHttpError({
        response: {
          status: 403,
          headers: {
            'x-ratelimit-remaining': '0',
            'x-github-request-id': 'ABC',
          },
        },
      });
      expect(isGithubRateLimitError(error)).toBe(true);
    });

    it('returns true for an AxiosError with rate-limit response headers', () => {
      const error = Object.assign(new AxiosError('Request failed'), {
        response: {
          status: 403,
          headers: {
            'x-ratelimit-remaining': '0',
            'x-github-request-id': 'ABC',
          },
        },
      });
      expect(isGithubRateLimitError(error)).toBe(true);
    });

    it('returns true when a rate-limit error is wrapped in error.cause', () => {
      const cause = Object.assign(new AxiosError('Request failed'), {
        response: {
          status: 403,
          headers: {
            'x-ratelimit-remaining': '0',
            'x-github-request-id': 'ABC',
          },
        },
      });
      const wrapped = new Error('An error occurred fetching the source.', {
        cause,
      });
      expect(isGithubRateLimitError(wrapped)).toBe(true);
    });

    it('returns false for a GitHub error that is not rate limited', () => {
      const error = Object.assign(new AxiosError('Server error'), {
        response: {
          status: 500,
          headers: { 'x-github-request-id': 'ABC' },
        },
      });
      expect(isGithubRateLimitError(error)).toBe(false);
    });

    it('returns false when the request id header is missing', () => {
      const error = Object.assign(new AxiosError('Request failed'), {
        response: {
          status: 403,
          headers: { 'x-ratelimit-remaining': '0' },
        },
      });
      expect(isGithubRateLimitError(error)).toBe(false);
    });

    it('returns false for null or undefined', () => {
      expect(isGithubRateLimitError(null)).toBe(false);
      expect(isGithubRateLimitError(undefined)).toBe(false);
    });
  });

  describe('getHttpStatusFromError()', () => {
    it('returns the status from a HubSpotHttpError', () => {
      const error = newHubSpotHttpError({
        response: { status: 404, headers: {} },
      });
      expect(getHttpStatusFromError(error)).toBe(404);
    });

    it('returns the status from an AxiosError response', () => {
      const error = Object.assign(new AxiosError('Not found'), {
        response: { status: 404, headers: {} },
      });
      expect(getHttpStatusFromError(error)).toBe(404);
    });

    it('returns the status from an AxiosError wrapped in error.cause', () => {
      const cause = Object.assign(new AxiosError('Not found'), {
        response: { status: 404, headers: {} },
      });
      const wrapped = new Error('An error occurred fetching the source.', {
        cause,
      });
      expect(getHttpStatusFromError(wrapped)).toBe(404);
    });

    it('returns undefined for an error with no status', () => {
      expect(getHttpStatusFromError(new Error('plain'))).toBeUndefined();
    });

    it('returns undefined for null or undefined', () => {
      expect(getHttpStatusFromError(null)).toBeUndefined();
      expect(getHttpStatusFromError(undefined)).toBeUndefined();
    });
  });
});
