import { HubSpotHttpError } from '../HubSpotHttpError';
import { AxiosError } from 'axios';

describe('models/HubSpotHttpError', () => {
  it('should set the standard options correctly', () => {
    const message = 'Something went wrong';
    const options = {
      cause: 'OH NO',
    };
    const result = new HubSpotHttpError(message, options);
    expect(result.message).toBe(message);
    expect(result.cause).toBe(options.cause);
    expect(result.name).toBe('HubSpotHttpError');
  });

  it('should set the context correctly', () => {
    const message = 'Something went wrong';
    const context = {
      request: '/some/path',
      payload: 'payload',
    };
    const result = new HubSpotHttpError(message, undefined, context);
    expect(result.context).toBe(context);
  });

  it('should extract the fields from the cause if it is an AxiosError', () => {
    const error1Message = 'Item 1 was incorrect';
    const error2Message = 'Item 2 was incorrect';
    const cause = new AxiosError(
      'Something went wrong',
      'CODE',
      {
        // @ts-expect-error test double
        headers: { 'content-type': 'application/json' },
        method: 'GET',
        params: {
          portalId: 123456,
        },
        url: '/some/path',
        data: { foo: 'bar' },
      },
      {},
      {
        data: {
          message: 'Something awful happened with the request',
          errors: [{ message: error1Message }, { message: error2Message }],
        },
        status: 400,
        statusText: 'Client error',
        headers: { 'content-type': 'application/json' },
      }
    );
    const result = new HubSpotHttpError('OH NO', { cause });
    expect(result.context).toStrictEqual({
      accountId: cause.config!.params.portalId,
      payload: JSON.stringify(cause.config!.data),
      request: cause.config!.url,
    });
    expect(result.message).toStrictEqual(
      `The request was bad. ${cause.response!.data.message} \n- ${error1Message} \n- ${error2Message}`
    );

    expect(result.code).toBeDefined();
    expect(result.code).toBe(cause.code);

    expect(result.method).toBeDefined();
    expect(result.method).toBe(cause.config!.method);

    expect(result.status).toBeDefined();
    expect(result.status).toBe(cause.response!.status);

    expect(result.statusText).toBeDefined();
    expect(result.statusText).toBe(cause.response!.statusText);

    expect(result.data).toBeDefined();
    expect(result.data).toBe(cause.response!.data);

    expect(result.headers).toBeDefined();
    expect(result.headers).toBe(cause.response!.headers);

    expect(result.validationErrors).toBeDefined();
    expect(result.validationErrors).toStrictEqual([
      cause.response!.data.message,
      error1Message,
      error2Message,
    ]);
  });

  // describe('getHubSpotHttpErrorWithContext()', () => {
  //   it('includes the original cause', () => {
  //     const error = newHubSpotHttpError();
  //     const hubspotHttpErrorWithContext = getHubSpotHttpErrorWithContext(error);
  //
  //     // @ts-expect-error cause is unknown
  //     expect(hubspotHttpErrorWithContext.cause.name).toBe(error.name);
  //   });
  //
  //   describe('context tests', () => {
  //     it('handles message detail context without request', () => {
  //       const error = newHubSpotHttpError({ status: 699 });
  //       const hubspotHttpErrorWithContext = getHubSpotHttpErrorWithContext(
  //         error,
  //         {
  //           accountId: 123,
  //         }
  //       );
  //       expect(hubspotHttpErrorWithContext.message).toBe(
  //         'The request in account 123 failed.'
  //       );
  //     });
  //
  //     it('handles message detail context with request', () => {
  //       const error = newHubSpotHttpError({ status: 699 });
  //       const hubspotHttpErrorWithContext = getHubSpotHttpErrorWithContext(
  //         error,
  //         {
  //           accountId: 123,
  //           request: 'get some stuff',
  //         }
  //       );
  //       expect(hubspotHttpErrorWithContext.message).toBe(
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
  //         const hubspotHttpErrorWithContext = getHubSpotHttpErrorWithContext(
  //           error,
  //           errorContext
  //         );
  //         expect(hubspotHttpErrorWithContext.message).toContain(test.expected);
  //       });
  //     });
  //   });
  //
  //   describe('status code tests', () => {
  //     it('generates a generic api status code error', () => {
  //       const error = newHubSpotHttpError({ status: 699 });
  //       const hubspotHttpErrorWithContext =
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toBe('The request failed.');
  //     });
  //
  //     it('generates a generic 400 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 499,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toBe(
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
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toBe(
  //         'The request was bad.'
  //       );
  //     });
  //
  //     it('generates a 401 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 401,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toBe(
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
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toBe(
  //         'The request was forbidden.'
  //       );
  //     });
  //
  //     it('generates a 404 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 404,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toBe(
  //         'The request was not found.'
  //       );
  //     });
  //
  //     it('generates a 429 api status code error', () => {
  //       const error = newHubSpotHttpError({
  //         response: {
  //           status: 429,
  //         },
  //       });
  //       const hubspotHttpErrorWithContext =
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toBe(
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
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toContain(
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
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toContain(
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
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toBe(
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
  //         getHubSpotHttpErrorWithContext(error);
  //       expect(hubspotHttpErrorWithContext.message).toBe(
  //         'The request failed. \n- We wrote bad code.'
  //       );
  //     });
  //   });
  // });
});
