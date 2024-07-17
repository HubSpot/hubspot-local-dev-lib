import { isAxiosError } from 'axios';

export class HubSpotAuthError extends Error {
  status?: number;
  category?: string;
  subCategory?: string;
  constructor(message?: string, options?: ErrorOptions) {
    super(message);
    this.name = 'HubSpotAuthError';
    if (options && isAxiosError(options.cause)) {
      const { cause } = options;
      this.status = cause.response?.status;
      this.category = cause?.response?.data?.category || undefined;
      this.subCategory =
        (cause.response &&
          cause.response.data &&
          cause.response.data.subCategory) ||
        undefined;
    }
  }
}
