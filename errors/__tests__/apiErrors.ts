import { AxiosError, AxiosHeaders } from 'axios';
import {
  isMissingScopeError,
  isGatingError,
  isApiUploadValidationError,
  isSpecifiedHubSpotAuthError,
  getAxiosErrorWithContext,
  throwApiError,
  throwApiUploadError,
  isSpecifiedError,
} from '../apiErrors';
import { BaseError } from '../../types/Error';
import { HubSpotAuthError } from '../../models/HubSpotAuthError';

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
export const newAxiosError = (overrides: any = {}): AxiosError => {
  return new AxiosError(
    '',
    overrides.code || '',
    { headers: new AxiosHeaders(), ...overrides.config },
    {
      ...overrides.request,
    },
    {
      request: {
        href: 'http://example.com/',
        method: 'GET',
      },
      data: {},
      headers: {},
      status: 200,
      statusText: '',
      config: {},
      ...overrides.response,
    }
  );
};

describe('errors/apiErrors', () => {
  describe('isSpecifiedError()', () => {
    it('returns true for a matching specified error', () => {
      const error1 = newAxiosError({
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
      const error1 = newAxiosError({
        response: {
          status: 403,
          data: { category: 'BANNED', subCategory: 'USER_ACCESS_NOT_ALLOWED' },
        },
      });
      const error2 = newAxiosError({ isAxiosError: false });
      expect(
        isSpecifiedError(error1, {
          statusCode: 400,
          category: 'GATED',
        })
      ).toBe(false);
      expect(isMissingScopeError(error2)).toBe(false);
    });

    it('handles AxiosError returned in cause property', () => {
      const axiosError = newAxiosError({
        response: {
          status: 403,
          data: { category: 'BANNED', subCategory: 'USER_ACCESS_NOT_ALLOWED' },
        },
      });
      const error1 = new Error('', { cause: axiosError });
      expect(
        isSpecifiedError(error1, {
          statusCode: 403,
          category: 'BANNED',
          subCategory: 'USER_ACCESS_NOT_ALLOWED',
        })
      ).toBe(true);
    });
  });
  describe('isMissingScopeError()', () => {
    it('returns true for missing scope errors', () => {
      const error1 = newAxiosError({
        response: { status: 403, data: { category: 'MISSING_SCOPES' } },
      });
      expect(isMissingScopeError(error1)).toBe(true);
    });

    it('returns false for non missing scope errors', () => {
      const error1 = newAxiosError({
        response: { status: 400, data: { category: 'MISSING_SCOPES' } },
      });
      const error2 = newAxiosError({ isAxiosError: false });
      expect(isMissingScopeError(error1)).toBe(false);
      expect(isMissingScopeError(error2)).toBe(false);
    });
  });

  describe('isGatingError()', () => {
    it('returns true for gating errors', () => {
      const error1 = newAxiosError({
        response: { status: 403, data: { category: 'GATED' } },
      });
      expect(isGatingError(error1)).toBe(true);
    });

    it('returns false for non gating errors', () => {
      const error1 = newAxiosError({
        response: { status: 400, data: { category: 'GATED' } },
      });
      const error2 = newAxiosError({ isAxiosError: false });
      expect(isGatingError(error1)).toBe(false);
      expect(isGatingError(error2)).toBe(false);
    });
  });

  describe('isApiUploadValidationError()', () => {
    it('returns true for api upload validation errors', () => {
      const error1 = newAxiosError({
        response: { data: { message: 'upload validation error' }, status: 400 },
      });
      const error2 = newAxiosError({
        response: { data: { errors: [] }, status: 400 },
      });
      expect(isApiUploadValidationError(error1)).toBe(true);
      expect(isApiUploadValidationError(error2)).toBe(true);
    });

    it('returns false for non api upload validation errors', () => {
      const error1 = newAxiosError({
        response: { status: 400, data: null },
      });
      const error2 = newAxiosError({ isAxiosError: false });
      expect(isApiUploadValidationError(error1)).toBe(false);
      expect(isApiUploadValidationError(error2)).toBe(false);
    });
  });

  describe('isSpecifiedHubSpotAuthError()', () => {
    it('returns true for matching HubSpot auth errors', () => {
      const error1 = new HubSpotAuthError('', {
        cause: new AxiosError(
          '',
          '',
          { headers: new AxiosHeaders() },
          {},
          // @ts-expect-error Not going to mock the whole thing
          { status: 123 }
        ),
      });
      expect(isSpecifiedHubSpotAuthError(error1, { status: 123 })).toBe(true);
    });

    it('returns false for non matching HubSpot auth errors', () => {
      const error1 = newError({ name: 'HubSpotAuthError', status: 123 });
      expect(isSpecifiedHubSpotAuthError(error1, { status: 124 })).toBe(false);
    });
  });

  describe('getAxiosErrorWithContext()', () => {
    it('includes the original cause', () => {
      const error = newAxiosError();
      const axiosErrorWithContext = getAxiosErrorWithContext(error);

      // @ts-expect-error cause is unknown
      expect(axiosErrorWithContext.cause.name).toBe(error.name);
    });

    describe('context tests', () => {
      it('handles message detail context without request', () => {
        const error = newAxiosError({ status: 699 });
        const axiosErrorWithContext = getAxiosErrorWithContext(error, {
          accountId: 123,
        });
        expect(axiosErrorWithContext.message).toBe(
          'The request in account 123 failed.'
        );
      });

      it('handles message detail context with request', () => {
        const error = newAxiosError({ status: 699 });
        const axiosErrorWithContext = getAxiosErrorWithContext(error, {
          accountId: 123,
          request: 'get some stuff',
        });
        expect(axiosErrorWithContext.message).toBe(
          "The request for 'get some stuff' in account 123 failed."
        );
      });

      it('includes actions and prepositions', () => {
        const errorContext = {
          accountId: 123,
          request: 'get some stuff',
        };
        [
          { method: null, expected: 'request for' },
          { method: 'delete', expected: 'delete of' },
          { method: 'get', expected: 'request for' },
          { method: 'patch', expected: 'update to' },
          { method: 'post', expected: 'post to' },
          { method: 'put', expected: 'update to' },
        ].forEach(test => {
          const error = newAxiosError({
            status: 699,
            config: { method: test.method },
          });
          const axiosErrorWithContext = getAxiosErrorWithContext(
            error,
            errorContext
          );
          expect(axiosErrorWithContext.message).toContain(test.expected);
        });
      });
    });

    describe('status code tests', () => {
      it('generates a generic api status code error', () => {
        const error = newAxiosError({ status: 699 });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toBe('The request failed.');
      });

      it('generates a generic 400 api status code error', () => {
        const error = newAxiosError({
          response: {
            status: 499,
          },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toBe(
          'The request failed due to a client error.'
        );
      });

      it('generates a 400 api status code error', () => {
        const error = newAxiosError({
          response: {
            status: 400,
          },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toBe('The request was bad.');
      });

      it('generates a 401 api status code error', () => {
        const error = newAxiosError({
          response: {
            status: 401,
          },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toBe(
          'The request was unauthorized.'
        );
      });

      it('generates a 403 api status code error', () => {
        const error = newAxiosError({
          response: {
            status: 403,
          },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toBe(
          'The request was forbidden.'
        );
      });

      it('generates a 404 api status code error', () => {
        const error = newAxiosError({
          response: {
            status: 404,
          },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toBe(
          'The request was not found.'
        );
      });

      it('generates a 429 api status code error', () => {
        const error = newAxiosError({
          response: {
            status: 429,
          },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toBe(
          'The request surpassed the rate limit. Retry in one minute.'
        );
      });

      it('generates a generic 500 api status code error', () => {
        const error = newAxiosError({
          response: {
            status: 599,
          },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toContain(
          'The request failed due to a server error.'
        );
      });

      it('generates a 503 api status code error', () => {
        const error = newAxiosError({
          response: {
            status: 503,
          },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toContain(
          'The request could not be handled at this time.'
        );
      });
    });

    describe('backend messaging tests', () => {
      it('appends the message returned by the backend', () => {
        const error = newAxiosError({
          status: 699,
          response: { data: { message: 'Our servers exploded.' } },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toBe(
          'The request failed. Our servers exploded.'
        );
      });

      it('appends the nested error messaged returned by the backend', () => {
        const error = newAxiosError({
          status: 699,
          response: {
            data: { errors: [{ message: 'We wrote bad code.' }] },
          },
        });
        const axiosErrorWithContext = getAxiosErrorWithContext(error);
        expect(axiosErrorWithContext.message).toBe(
          'The request failed. \n- We wrote bad code.'
        );
      });
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
