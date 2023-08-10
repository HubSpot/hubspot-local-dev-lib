import { ReadStream } from 'fs';
import { Url } from 'url';

type Body = { [key: string]: string | number | Body };

export type AxiosConfigOptions = {
  uri: string | Url;
  env?: string;
  localHostOverride?: boolean;
  params?: {
    portalId?: number;
    buffer?: boolean;
    environmentId?: number;
    version?: string;
  };
  body?: Body;
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
