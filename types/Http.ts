import { ReadStream } from 'fs';

export type Data = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type QueryParams = {
  [key: string]: string | number | boolean | undefined;
};

export type AxiosConfigOptions = {
  baseURL?: string;
  url: string;
  env?: string;
  localHostOverride?: boolean;
  params?: QueryParams;
  data?: Data;
  resolveWithFullResponse?: boolean;
  timeout?: number;
};

export type FormData = {
  [key: string]: string | ReadStream;
};

export type HttpOptions = AxiosConfigOptions & {
  query?: QueryParams;
  formData?: FormData;
  timeout?: number;
  encoding?: string | null;
  headers?: { [header: string]: string | string[] | undefined };
};
