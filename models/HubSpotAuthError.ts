import { AxiosError } from 'axios';

export class HubSpotAuthError extends Error {
  status?: number;
  category?: string;
  subCategory?: string;
  constructor(message: string, { cause = {} }: { cause?: AxiosError }) {
    super(message);
    this.name = 'HubSpotAuthError';
    this.status = cause.status;
    this.category = cause?.response?.body?.category || undefined;
    this.subCategory =
      (cause.response &&
        cause.response.body &&
        cause.response.body.subCategory) ||
      undefined;
  }
}
