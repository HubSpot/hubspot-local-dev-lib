import {
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
  RawAxiosResponseHeaders,
  AxiosResponseHeaders,
  Method,
} from 'axios';
import { isHubSpotHttpError, joinErrorMessages } from '../errors/apiErrors';
import { HubSpotHttpErrorContext, ValidationError } from '../types/Error';

export function parseValidationErrors(
  responseData: {
    errors?: Array<ValidationError>;
    message?: string;
  } = { errors: [], message: '' }
): Array<string> {
  if (!responseData) {
    return [];
  }

  const errorMessages = [];

  const { errors, message } = responseData;

  if (message) {
    errorMessages.push(message);
  }

  if (errors) {
    const specificErrors = errors.map(error => {
      let errorMessage = error.message;
      if (error.errorTokens && error.errorTokens.line) {
        errorMessage = `line ${error.errorTokens.line}: ${errorMessage}`;
      }
      return errorMessage;
    });
    errorMessages.push(...specificErrors);
  }

  return errorMessages;
}

function getUserFriendlyHttpErrorMessage(
  error: unknown,
  context: HubSpotHttpErrorContext = {}
): string | undefined {
  if (isHubSpotHttpError(error)) {
    // HubSpotHttpErrors should have the user-friendly error message on creation
    return error.message;
  } else if (isAxiosError(error)) {
    return joinErrorMessages(error, context);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HubSpotHttpError<T = any, D = any> extends Error {
  public status?: number;
  public response?: AxiosResponse<T, D>;
  public config?: InternalAxiosRequestConfig<D>;
  public code?: string;
  public request?: unknown;
  public statusText?: string;
  public data?: T;
  public headers?: RawAxiosResponseHeaders | AxiosResponseHeaders;
  public method: Method | string | undefined;
  public context: HubSpotHttpErrorContext | undefined;
  public validationErrors: string[] | undefined;

  constructor(
    message?: string,
    options?: ErrorOptions,
    context?: HubSpotHttpErrorContext
  ) {
    super(message, options);
    this.name = 'HubSpotHttpError';
    this.context = context;

    if (options && isAxiosError(options.cause)) {
      this.message =
        getUserFriendlyHttpErrorMessage(options.cause) || this.message;
      const { response, request, config, code } = options.cause;
      this.response = response;

      this.config = config;
      this.code = code;
      this.request = request;
      this.method = config?.method;

      // Pull the request fields to the top level
      if (response) {
        this.status = response.status;
        this.statusText = response.statusText;
        this.data = response.data;
        this.headers = response.headers;
        this.validationErrors = parseValidationErrors(response.data);
      }
    }
  }
}
