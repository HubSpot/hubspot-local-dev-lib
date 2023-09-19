import { ReadStream } from 'fs';

export type Body = {
  // TODO - Return if we find a better way to represent the Body type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type AxiosConfigOptions = {
  url: string;
  env?: string;
  localHostOverride?: boolean;
  params?: {
    portalId?: number;
    buffer?: boolean;
    environmentId?: number;
    version?: string;
  };
  body?: Body | JSON;
  resolveWithFullResponse?: boolean;
};

export type QueryParams = {
  [key: string]: string | number | boolean;
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
