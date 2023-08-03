type ErrorResponse = {
  statusCode: number;
  body: { category: string; subCategory: string };
};

export class HubSpotAuthError extends Error {
  statusCode: number;
  category?: string;
  subCategory?: string;

  constructor(message: string, errorResponse: ErrorResponse) {
    super(message);
    this.name = 'HubSpotAuthError';
    this.statusCode = errorResponse.statusCode;
    this.category =
      (errorResponse.body && errorResponse.body.category) || undefined;
    this.subCategory =
      (errorResponse.body && errorResponse.body.subCategory) || undefined;
  }
}
