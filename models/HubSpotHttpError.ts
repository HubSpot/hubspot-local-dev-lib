import { AxiosResponse, InternalAxiosRequestConfig, isAxiosError } from 'axios';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HubSpotHttpError<T = any, D = any> extends Error {
  public status?: number;
  public response?: AxiosResponse<T, D>;
  public config?: InternalAxiosRequestConfig<D>;
  public code?: string;
  public request?: unknown;
  public statusText?: string;
  public data?: T;

  // Add this in so any pre-existing checks for error.isAxiosError continue to
  // function until they can be ported over to the new error check
  public isAxiosError = true;

  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'HubSpotHttpError';

    if (options && isAxiosError(options.cause)) {
      // Add these for backwards compatibility until we have updated all the checks
      // in the CLI for the Axios implementation details, and then we can remove these or
      // keep whatever we find useful in custom fields on this object
      const { response, request, config, code } = options.cause;
      this.response = response;
      this.request = request;
      this.config = config;

      // Add any custom fields we feel are necessary or make our collective lives easier
      this.code = code;
      if (response) {
        this.status = response.status;
        this.statusText = response.statusText;
        this.data = response.data;
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isHubSpotHttpError<T = any, D = any>(
  error?: unknown
): error is HubSpotHttpError<T, D> {
  return !!error && error instanceof HubSpotHttpError;
}
