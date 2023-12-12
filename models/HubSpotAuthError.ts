import { AxiosError } from 'axios';

export class HubSpotAuthError extends Error {
  status?: number;
  category?: string;
  subCategory?: string;
  constructor(
    message: string,
    {
      cause = {},
    }: {
      cause?: Partial<AxiosError<{ category?: string; subCategory?: string }>>;
    }
  ) {
    super(message);
    this.name = 'HubSpotAuthError';
    this.status = cause.status;
    this.category = cause?.response?.data?.category || undefined;
    this.subCategory =
      (cause.response &&
        cause.response.data &&
        cause.response.data.subCategory) ||
      undefined;
  }
}
