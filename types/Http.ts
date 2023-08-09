import { ReadStream } from 'fs';
import { CoreOptions, UriOptions } from 'request';
import { Url } from 'url';

export type RequestOptions = CoreOptions & UriOptions;

type Body = { [key: string]: string | number | Body };

export type GetRequestOptionsOptions = {
  uri: string | Url;
  env?: string;
  localHostOverride?: boolean;
  qs?: {
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

export type HttpOptions = GetRequestOptionsOptions & {
  query?: QueryParams;
  formData?: FormData;
  timeout?: number;
  encoding?: string | null;
  headers?: { [header: string]: string | string[] | undefined };
};
