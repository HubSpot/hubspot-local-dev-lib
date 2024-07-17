import {
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
  RawAxiosResponseHeaders,
  AxiosResponseHeaders,
  Method,
} from 'axios';
import { getUserFriendlyHttpErrorMessage } from '../errors/apiErrors';

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

  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'HubSpotHttpError';

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
      }
    }
  }
}
