import { AxiosError } from 'axios';
import {
  isMissingScopeError,
  isGatingError,
  isApiUploadValidationError,
  isSpecifiedHubSpotAuthError,
  getAxiosErrorWithContext,
  throwApiError,
  throwApiUploadError,
} from '../apiErrors';
import { BaseError } from '../../types/Error';

export const newError = (overrides = {}): BaseError => {
  return {
    name: 'Error',
    message: 'An error ocurred',
    status: 200,
    errors: [],
    ...overrides,
  };
};

export const newAxiosError = (overrides = {}): AxiosError => {
  return {
    ...newError(),
    isAxiosError: true,
    name: 'AxiosError',
    response: {
      request: {
        href: 'http://example.com/',
        method: 'GET',
      },
      data: {},
      headers: {},
      status: 200,
      statusText: '',
      // @ts-expect-error don't need to test headers
      config: {},
    },
    ...overrides,
  };
};

describe('errors/apiErrors', () => {
  describe('isMissingScopeError()', () => {
    it('returns true for missing scope errors', () => {
      const error1 = newAxiosError({
        status: 403,
        response: { data: { category: 'MISSING_SCOPES' } },
      });
      expect(isMissingScopeError(error1)).toBe(true);
    });

    it('returns false for non missing scope errors', () => {
      const error1 = newAxiosError({
        status: 400,
        response: { data: { category: 'MISSING_SCOPES' } },
      });
      const error2 = newAxiosError({ isAxiosError: false });
      expect(isMissingScopeError(error1)).toBe(false);
      expect(isMissingScopeError(error2)).toBe(false);
    });
  });

  describe('isGatingError()', () => {
    it('returns true for gating errors', () => {
      const error1 = newAxiosError({
        status: 403,
        response: { data: { category: 'GATED' } },
      });
      expect(isGatingError(error1)).toBe(true);
    });

    it('returns false for non gating errors', () => {
      const error1 = newAxiosError({
        status: 400,
        response: { data: { category: 'GATED' } },
      });
      const error2 = newAxiosError({ isAxiosError: false });
      expect(isGatingError(error1)).toBe(false);
      expect(isGatingError(error2)).toBe(false);
    });
  });

  describe('isApiUploadValidationError()', () => {
    it('returns true for api upload validation errors', () => {
      const error1 = newAxiosError({
        status: 400,
        response: { data: { message: 'upload validation error' } },
      });
      const error2 = newAxiosError({
        status: 400,
        response: { data: { errors: [] } },
      });
      expect(isApiUploadValidationError(error1)).toBe(true);
      expect(isApiUploadValidationError(error2)).toBe(true);
    });

    it('returns false for non api upload validation errors', () => {
      const error1 = newAxiosError({
        status: 400,
        response: { data: null },
      });
      const error2 = newAxiosError({ isAxiosError: false });
      expect(isApiUploadValidationError(error1)).toBe(false);
      expect(isApiUploadValidationError(error2)).toBe(false);
    });
  });

  describe('isSpecifiedHubSpotAuthError()', () => {
    it('returns true for matching HubSpot auth errors', () => {
      const error1 = newError({ name: 'HubSpotAuthError', status: 123 });
      expect(isSpecifiedHubSpotAuthError(error1, { status: 123 })).toBe(true);
    });

    it('returns false for non matching HubSpot auth errors', () => {
      const error1 = newError({ name: 'HubSpotAuthError', status: 123 });
      expect(isSpecifiedHubSpotAuthError(error1, { status: 124 })).toBe(false);
    });
  });

  describe('getAxiosErrorWithContext()', () => {
    it('throws api status code error', () => {
      const error = newAxiosError();
      expect(() => {
        throw getAxiosErrorWithContext(error);
      }).toThrow();
    });
  });

  describe('throwApiError()', () => {
    it('throws api error', () => {
      const error = newAxiosError();
      expect(() => throwApiError(error)).toThrow();
    });
  });

  describe('throwApiUploadError()', () => {
    it('throws api upload error', () => {
      const error = newAxiosError();
      expect(() => throwApiUploadError(error)).toThrow();
    });
  });
});
