import {
  isApiStatusCodeError,
  isMissingScopeError,
  isGatingError,
  isApiUploadValidationError,
  isSpecifiedHubSpotAuthError,
  throwStatusCodeError,
  throwApiStatusCodeError,
  throwApiError,
  throwApiUploadError,
} from '../apiErrors';
import { BaseError, GenericError, StatusCodeError } from '../../types/Error';

export const newError = (overrides = {}): BaseError => {
  return {
    name: 'Error',
    message: 'An error ocurred',
    status: 200,
    errors: [],
    ...overrides,
  };
};

export const newStatutsCodeError = (overrides = {}): GenericError => {
  return {
    ...newError(),
    name: 'StatusCodeError',
    response: {
      request: {
        href: 'http://example.com/',
        method: 'GET',
      },
      body: {},
      headers: {},
      status: 200,
    },
    ...overrides,
  };
};

describe('apiErrors', () => {
  describe('isApiStatusCodeError', () => {
    it('returns true for api status code errors', () => {
      const error1 = newError({ status: 100 });
      const error2 = newError({ status: 599 });
      const error3 = newStatutsCodeError({ status: 99 });
      expect(isApiStatusCodeError(error1)).toBe(true);
      expect(isApiStatusCodeError(error2)).toBe(true);
      expect(isApiStatusCodeError(error3)).toBe(true);
    });

    it('returns false for non api status code errors', () => {
      const error1 = newError({ status: 99 });
      const error2 = newError({ status: 600 });
      expect(isApiStatusCodeError(error1)).toBe(false);
      expect(isApiStatusCodeError(error2)).toBe(false);
    });
  });

  describe('isMissingScopeError', () => {
    it('returns true for missing scope errors', () => {
      const error1 = newStatutsCodeError({
        status: 403,
        error: { category: 'MISSING_SCOPES' },
      });
      expect(isMissingScopeError(error1)).toBe(true);
    });

    it('returns false for non missing scope errors', () => {
      const error1 = newStatutsCodeError({
        status: 400,
        error: { category: 'MISSING_SCOPES' },
      });
      const error2 = newStatutsCodeError({ name: 'NonStatusCodeError' });
      expect(isMissingScopeError(error1)).toBe(false);
      expect(isMissingScopeError(error2)).toBe(false);
    });
  });

  describe('isGatingError', () => {
    it('returns true for gating errors', () => {
      const error1 = newStatutsCodeError({
        status: 403,
        error: { category: 'GATED' },
      });
      expect(isGatingError(error1)).toBe(true);
    });

    it('returns false for non gating errors', () => {
      const error1 = newStatutsCodeError({
        status: 400,
        error: { category: 'GATED' },
      });
      const error2 = newStatutsCodeError({ name: 'NonStatusCodeError' });
      expect(isGatingError(error1)).toBe(false);
      expect(isGatingError(error2)).toBe(false);
    });
  });

  describe('isApiUploadValidationError', () => {
    it('returns true for api upload validation errors', () => {
      const error1 = newStatutsCodeError({
        status: 400,
        response: { body: { message: 'upload validation error' } },
      });
      const error2 = newStatutsCodeError({
        status: 400,
        response: { body: { errors: [] } },
      });
      expect(isApiUploadValidationError(error1)).toBe(true);
      expect(isApiUploadValidationError(error2)).toBe(true);
    });

    it('returns false for non api upload validation errors', () => {
      const error1 = newStatutsCodeError({
        status: 400,
        response: { body: null },
      });
      const error2 = newStatutsCodeError({ name: 'NonStatusCodeError' });
      expect(isApiUploadValidationError(error1)).toBe(false);
      expect(isApiUploadValidationError(error2)).toBe(false);
    });
  });

  describe('isSpecifiedHubSpotAuthError', () => {
    it('returns true for matching HubSpot auth errors', () => {
      const error1 = newError({ name: 'HubSpotAuthError', status: 123 });
      expect(isSpecifiedHubSpotAuthError(error1, { status: 123 })).toBe(true);
    });

    it('returns false for non matching HubSpot auth errors', () => {
      const error1 = newError({ name: 'HubSpotAuthError', status: 123 });
      expect(isSpecifiedHubSpotAuthError(error1, { status: 124 })).toBe(false);
    });
  });

  describe('throwStatusCodeError', () => {
    it('throws status code error', () => {
      const error = newStatutsCodeError() as StatusCodeError;
      expect(() => throwStatusCodeError(error)).toThrow();
    });
  });

  describe('throwApiStatusCodeError', () => {
    it('throws api status code error', () => {
      const error = newStatutsCodeError() as StatusCodeError;
      expect(() => throwApiStatusCodeError(error)).toThrow();
    });
  });

  describe('throwApiError', () => {
    it('throws api error', () => {
      const error = newStatutsCodeError() as StatusCodeError;
      expect(() => throwApiError(error)).toThrow();
    });
  });

  describe('throwApiUploadError', () => {
    it('throws api upload error', () => {
      const error = newStatutsCodeError() as StatusCodeError;
      expect(() => throwApiUploadError(error)).toThrow();
    });
  });
});
