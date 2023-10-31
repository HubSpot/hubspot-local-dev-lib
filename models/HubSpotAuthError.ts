import { StatusCodeError } from '../types/Error';

export class HubSpotAuthError extends Error {
  statusCode?: number;
  category?: string;
  subCategory?: string;
  constructor(
    message: string,
    { cause = {} }: { cause?: Partial<StatusCodeError> }
  ) {
    super(message);
    this.name = 'HubSpotAuthError';
    this.statusCode = cause.statusCode;
    this.category = cause?.response?.body?.category || undefined;
    this.subCategory =
      (cause.response &&
        cause.response.body &&
        cause.response.body.subCategory) ||
      undefined;
  }
}
