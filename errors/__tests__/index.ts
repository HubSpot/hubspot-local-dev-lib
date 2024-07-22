import {
  isMissingScopeError,
  isGatingError,
  isSpecifiedError,
  isApiUploadValidationError,
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

  describe('isApiUploadValidationError()', () => {
    it('returns true for api upload validation errors', () => {
      const error1 = newHubSpotHttpError({
        response: { data: { message: 'upload validation error' }, status: 400 },
      });
      const error2 = newHubSpotHttpError({
        response: { data: { errors: [] }, status: 400 },
      });
      expect(isApiUploadValidationError(error1)).toBe(true);
      expect(isApiUploadValidationError(error2)).toBe(true);
    });

    it('returns false for non api upload validation errors', () => {
      const error1 = newHubSpotHttpError({
        response: { status: 400, data: null },
      });
      const error2 = newHubSpotHttpError({ isAxiosError: false });
      expect(isApiUploadValidationError(error1)).toBe(false);
      expect(isApiUploadValidationError(error2)).toBe(false);
    });
  });

  // TODO: Move these to HubSpotHttpError tests
  // describe('getHubSpotHttpErrorWithContext()', () => {
  //   it('includes the original cause', () => {
  //     const error = newHubSpotHttpError();
  //     const hubspotHttpErrorWithContext =
  //       getUserFriendlyHttpErrorMessage(error);
  //
  //     // @ts-expect-error cause is unknown
  //     expect(hubspotHttpErrorWithContext.cause.name).toBe(error.name);
  //   });
  //
  //   describe('context tests', () => {
  //     it('handles message detail context without request', () => {
  //       const error = newHubSpotHttpError({ status: 699 });
  //       const hubspotHttpErrorWithContext = getUserFriendlyHttpErrorMessage(
  //         error,
  //         {
  //           accountId: 123,
  //         }
  //       );
  //       expect(hubspotHttpErrorWithContext).toBe(
  //         'The request in account 123 failed.'
  //       );
  //     });
  //
  //     it('handles message detail context with request', () => {
  //       const error = newHubSpotHttpError({ status: 699 });
  //       const hubspotHttpErrorWithContext = getUserFriendlyHttpErrorMessage(
  //         error,
  //         {
  //           accountId: 123,
  //           request: 'get some stuff',
  //         }
  //       );
  //       expect(hubspotHttpErrorWithContext).toBe(
  //         "The request for 'get some stuff' in account 123 failed."
  //       );
  //     });
  //
  //     it('includes actions and prepositions', () => {
  //       const errorContext = {
  //         accountId: 123,
  //         request: 'get some stuff',
  //       };
  //       [
  //         { method: null, expected: 'request for' },
  //         { method: 'delete', expected: 'delete of' },
  //         { method: 'get', expected: 'request for' },
  //         { method: 'patch', expected: 'update to' },
  //         { method: 'post', expected: 'post to' },
  //         { method: 'put', expected: 'update to' },
  //       ].forEach(test => {
  //         const error = newHubSpotHttpError({
  //           status: 699,
  //           config: { method: test.method },
  //         });
  //         const hubspotHttpErrorWithContext = getUserFriendlyHttpErrorMessage(
  //           error,
  //           errorContext
  //         );
  //         expect(hubspotHttpErrorWithContext).toContain(test.expected);
  //       });
  //     });
  //   });
  //
  //   describe('status code tests', () => {
  //     it('generates a generic api status code error', () => {
  //       const error = newHubSpotHttpError({ status: 699 });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toBe('The request failed.');
  //     });
  //
  //     it('generates a generic 400 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 499,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toBe(
  //         'The request failed due to a client error.'
  //       );
  //     });
  //
  //     it('generates a 400 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 400,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toBe('The request was bad.');
  //     });
  //
  //     it('generates a 401 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 401,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toBe(
  //         'The request was unauthorized.'
  //       );
  //     });
  //
  //     it('generates a 403 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 403,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toBe('The request was forbidden.');
  //     });
  //
  //     it('generates a 404 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 404,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toBe('The request was not found.');
  //     });
  //
  //     it('generates a 429 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 429,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toBe(
  //         'The request surpassed the rate limit. Retry in one minute.'
  //       );
  //     });
  //
  //     it('generates a generic 500 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 599,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toContain(
  //         'The request failed due to a server error.'
  //       );
  //     });
  //
  //     it('generates a 503 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 503,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toContain(
  //         'The request could not be handled at this time.'
  //       );
  //     });
  //   });
  //
  //   describe('backend messaging tests', () => {
  //     it('appends the message returned by the backend', () => {
  //       const error = newHubSpotHttpError({
  //         status: 699,
  //         response: { data: { message: 'Our servers exploded.' } },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toBe(
  //         'The request failed. Our servers exploded.'
  //       );
  //     });
  //
  //     it('appends the nested error messaged returned by the backend', () => {
  //       const error = newHubSpotHttpError({
  //         status: 699,
  //         response: {
  //           data: { errors: [{ message: 'We wrote bad code.' }] },
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getUserFriendlyHttpErrorMessage(error);
  //       expect(hubspotHttpErrorWithContext).toBe(
  //         'The request failed. \n- We wrote bad code.'
  //       );
  //     });
  //   });
  // });

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
