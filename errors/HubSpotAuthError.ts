import { FullResponse } from 'request-promise-native';

export class HubSpotAuthError extends Error {
  statusCode?: number;
  category?: string;
  subCategory?: string;
  constructor(message: string, errorResponse: Partial<FullResponse> = {}) {
    super(message);
    this.name = 'HubSpotAuthError';
    this.statusCode = errorResponse && errorResponse.statusCode;
    this.category =
      (errorResponse.body && errorResponse.body.category) || undefined;
    this.subCategory =
      (errorResponse.body && errorResponse.body.subCategory) || undefined;
  }
}
