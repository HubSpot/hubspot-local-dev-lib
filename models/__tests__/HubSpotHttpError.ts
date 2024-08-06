import { HubSpotHttpError } from '../HubSpotHttpError';
import { AxiosError } from 'axios';

describe('models/HubSpotHttpError', () => {
  const portalId = 123456;

  const newAxiosError = (overrides?: {
    message?: string;
    code?: string;
    config?: unknown;
    request?: unknown;
    response?: unknown;
  }) => {
    const { message, code, config, request, response } = overrides || {};
    return new AxiosError(
      message || 'Something went wrong',
      code || 'CODE',
      // @ts-expect-error test double, no need for full type
      config || {
        headers: { 'content-type': 'application/json' },
        method: 'GET',
        params: {
          portalId,
        },
        url: '/some/path',
        data: { foo: 'bar' },
      },
      request || {},
      response || {
        data: {
          message: 'Something awful happened with the request',
          errors: [
            { message: 'Item 1 was incorrect' },
            { message: 'Item 2 was incorrect' },
          ],
        },
        status: 400,
        statusText: 'Client error',
        headers: { 'content-type': 'application/json' },
      }
    );
  };

  describe('constructor', () => {
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
      const cause = newAxiosError();
      const result = new HubSpotHttpError('OH NO', { cause });
      const error1Message = result.validationErrors?.[1];
      const error2Message = result.validationErrors?.[2];
      expect(result.context).toStrictEqual({
        accountId: portalId,
        payload: JSON.stringify(cause.config!.data),
        request: cause.config!.url,
      });
      expect(result.message).toStrictEqual(
        `The request in account ${portalId} was bad. ${cause.response!.data.message} \n- ${error1Message} \n- ${error2Message}`
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

    it('should handle Errors as the cause', () => {
      const errorMessage = 'Error happened';
      const errorReason = 'This is what caused the error';
      const error = new Error(errorMessage);
      // @ts-expect-error adding reason prop that doesn't exist on base error def
      error.reason = errorReason;
      const hubspotHttpError = new HubSpotHttpError('Something went wrong', {
        cause: error,
      });
      expect(hubspotHttpError.message).toBe(`${errorMessage} ${errorReason}`);
    });
  });

  describe('updateContext', () => {
    it('should set the context correctly when it begins as null', () => {
      const hubspotHttpError = new HubSpotHttpError();
      expect(hubspotHttpError.context).toBeUndefined();
      hubspotHttpError.updateContext({ accountId: portalId });
      expect(hubspotHttpError.context).toStrictEqual({ accountId: portalId });
    });

    it('should updates the context correctly when it already has items in it', () => {
      const hubspotHttpError = new HubSpotHttpError();
      hubspotHttpError.updateContext({ accountId: portalId });
      hubspotHttpError.updateContext({ payload: 'payload' });
      expect(hubspotHttpError.context).toStrictEqual({
        accountId: portalId,
        payload: 'payload',
      });
    });
  });

  describe('toString', () => {
    let cause: Error;
    const div = `\n- `;
    const message = `HubSpotHttpError: ${div}message: The request for '/some/path' in account 123456 was bad. Something awful happened with the request ${div}Item 1 was incorrect ${div}Item 2 was incorrect`;
    const statusMessage = `${div}status: 400`;
    const statusTextMessage = `${div}statusText: Client error`;
    const methodMessage = `${div}method: GET`;
    const codeMessage = `${div}code: CODE`;
    const validationMessage = `${div}errors: Something awful happened with the request\n- Item 1 was incorrect\n- Item 2 was incorrect`;
    const contextMessage = `${div}context: {\n  "accountId": 123456,\n  "payload": "{\\"foo\\":\\"bar\\"}",\n  "request": "/some/path"\n}`;

    beforeEach(() => {
      cause = newAxiosError();
    });

    it('should return the formatted string correctly with all fields set', () => {
      const hubspotHttpError = new HubSpotHttpError('', {
        cause,
      });
      expect(hubspotHttpError.toString()).toStrictEqual(
        `${message}${statusMessage}${statusTextMessage}${methodMessage}${codeMessage}${validationMessage}${contextMessage}`
      );
    });

    it('should return the formatted string correctly with validationErrors undefined', () => {
      const cause = newAxiosError();
      const hubspotHttpError = new HubSpotHttpError('', {
        cause,
      });
      hubspotHttpError.validationErrors = undefined;
      expect(hubspotHttpError.toString()).toStrictEqual(
        `${message}${statusMessage}${statusTextMessage}${methodMessage}${codeMessage}${contextMessage}`
      );
    });

    it('should return the formatted string correctly with context undefined', () => {
      const cause = newAxiosError();
      const hubspotHttpError = new HubSpotHttpError('', {
        cause,
      });
      hubspotHttpError.context = undefined;
      expect(hubspotHttpError.toString()).toStrictEqual(
        `${message}${statusMessage}${statusTextMessage}${methodMessage}${codeMessage}${validationMessage}`
      );
    });
  });

  describe('formattedValidationErrors', () => {
    it('should return the empty string when validationErrors is undefined', () => {
      const hubspotHttpError = new HubSpotHttpError('', {
        cause: newAxiosError(),
      });
      hubspotHttpError.validationErrors = undefined;
      expect(hubspotHttpError.formattedValidationErrors()).toStrictEqual('');
    });
    it('should return the formatted string correctly with validationErrors defined', () => {
      const hubspotHttpError = new HubSpotHttpError('', {
        cause: newAxiosError(),
      });
      expect(hubspotHttpError.formattedValidationErrors()).toStrictEqual(
        `Something awful happened with the request\n- Item 1 was incorrect\n- Item 2 was incorrect`
      );
    });
  });

  describe('updateContextFromCause', () => {
    it('should handle nullable causes', () => {
      const hubspotHttpError = new HubSpotHttpError('', {
        cause: newAxiosError(),
      });
      // @ts-expect-error private method
      hubspotHttpError.updateContextFromCause(null);
      expect(hubspotHttpError.context).toStrictEqual({
        accountId: portalId,
        payload: '{"foo":"bar"}',
        request: '/some/path',
      });
    });

    it('should update the context from the cause provided', () => {
      const hubspotHttpError = new HubSpotHttpError('', {
        cause: newAxiosError(),
      });
      hubspotHttpError.context = undefined;
      const newCause = new AxiosError(
        '',
        '',
        // @ts-expect-error test double
        {
          params: {
            portalId: 888888,
          },
          data: 'Yooooooo',
          url: '/some/different/path',
        }
      );
      // @ts-expect-error private method
      hubspotHttpError.updateContextFromCause(newCause);
      expect(hubspotHttpError.context).toStrictEqual({
        accountId: 888888,
        payload: '"Yooooooo"',
        request: '/some/different/path',
      });
    });
  });

  describe('parseValidationErrors', () => {
    it('should handle nullable responseData', () => {
      const hubspotHttpError = new HubSpotHttpError('', {});
      hubspotHttpError.validationErrors = undefined;

      // @ts-expect-error private method
      hubspotHttpError.parseValidationErrors(null);
      expect(hubspotHttpError.validationErrors).toBeUndefined();
    });
  });

  describe('joinErrorMessages', () => {
    const message = `The request was bad. Something awful happened with the request \n- Item 1 was incorrect \n- Item 2 was incorrect`;

    it('includes the original cause', () => {
      const error = newAxiosError();
      const hubspotHttpError = new HubSpotHttpError('', {});
      const joinedMessages =
        // @ts-expect-error private method
        hubspotHttpError.joinErrorMessages(error);

      expect(joinedMessages).toBe(message);
    });

    describe('context tests', () => {
      const accountId = 123;
      const request = 'get some stuff';
      it('handles message detail context without request', () => {
        const error = newAxiosError({ response: { status: 699 } });
        const hubspotHttpError = new HubSpotHttpError('', {});
        const joinedMessages =
          // @ts-expect-error private method
          hubspotHttpError.joinErrorMessages(error, {
            accountId,
          });

        expect(joinedMessages).toBe(
          `The request in account ${accountId} failed.`
        );
      });

      it('handles message detail context with request', () => {
        const error = newAxiosError({ response: { status: 699 } });
        const hubspotHttpError = new HubSpotHttpError('', {});
        const joinedMessages =
          // @ts-expect-error private method
          hubspotHttpError.joinErrorMessages(error, {
            accountId,
            request,
          });

        expect(joinedMessages).toBe(
          `The request for '${request}' in account ${accountId} failed.`
        );
      });

      it.each([
        { method: null, expected: 'request for' },
        { method: 'delete', expected: 'delete of' },
        { method: 'get', expected: 'request for' },
        { method: 'patch', expected: 'update to' },
        { method: 'post', expected: 'post to' },
        { method: 'put', expected: 'update to' },
      ])(
        'includes actions and prepositions $method',
        ({ method, expected }) => {
          const errorContext = {
            accountId,
            request,
          };
          const error = newAxiosError({
            response: { status: 699 },
            config: { method: method! },
          });
          const hubspotHttpError = new HubSpotHttpError('', {});
          const joinedMessages =
            // @ts-expect-error private method
            hubspotHttpError.joinErrorMessages(error, errorContext);

          expect(joinedMessages).toContain(expected);
        }
      );
    });

    describe('status code tests', () => {
      it.each([
        {
          status: 400,
          message: 'The request was bad.',
          name: 'generates a 400 api status code error',
        },
        {
          status: 401,
          message: 'The request was unauthorized.',
          name: 'generates a 401 api status code error',
        },
        {
          status: 403,
          message: 'The request was forbidden.',
          name: 'generates a 403 api status code error',
        },
        {
          status: 404,
          message: 'The request was not found.',
          name: 'generates a 404 api status code error',
        },
        {
          status: 429,
          message: 'The request surpassed the rate limit. Retry in one minute.',
          name: 'generates a 429 api status code error',
        },
        {
          status: 499,
          message: 'The request failed due to a client error.',
          name: 'generates a generic 400 api status code error',
        },
        {
          status: 503,
          message:
            'The request could not be handled at this time. Please try again or visit https://help.hubspot.com/ to submit a ticket or contact HubSpot Support if the issue persists.',
          name: 'generates a 503 api status code error',
        },
        {
          status: 599,
          message:
            'The request failed due to a server error. Please try again or visit https://help.hubspot.com/ to submit a ticket or contact HubSpot Support if the issue persists.',
          name: 'generates a generic 500 api status code error',
        },
        {
          status: 699,
          message: 'The request failed.',
          name: 'generates a generic api status code error',
        },
      ])('$name', ({ status, message }) => {
        const error = newAxiosError({ response: { status } });
        const hubspotHttpError = new HubSpotHttpError('', { cause: error });
        // @ts-expect-error private method
        expect(hubspotHttpError.joinErrorMessages(error)).toBe(message);
      });
    });

    describe('backend messaging tests', () => {
      it('appends the message returned by the backend', () => {
        // const error = newHubSpotHttpError({
        //   status: 699,
        //   response: { data: { message: 'Our servers exploded.' } },
        // });
        const error = newAxiosError({
          response: { status: 699, data: { message: 'Our servers exploded.' } },
        });
        const hubspotHttpError = new HubSpotHttpError('', { cause: error });
        // @ts-expect-error private method
        expect(hubspotHttpError.joinErrorMessages(error)).toBe(
          'The request failed. Our servers exploded.'
        );
      });

      it('appends the nested error messaged returned by the backend', () => {
        const error = newAxiosError({
          response: {
            status: 699,
            data: { errors: [{ message: 'We wrote bad code.' }] },
          },
        });
        const hubspotHttpError = new HubSpotHttpError('', { cause: error });
        // @ts-expect-error private method
        expect(hubspotHttpError.joinErrorMessages(error)).toBe(
          'The request failed. \n- We wrote bad code.'
        );
      });
    });
  });
});
