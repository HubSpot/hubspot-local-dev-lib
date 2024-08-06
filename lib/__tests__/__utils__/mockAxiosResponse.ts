import { AxiosResponse, AxiosHeaders } from 'axios';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockAxiosResponse(data?: any): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: new AxiosHeaders(),
    },
  };
}
