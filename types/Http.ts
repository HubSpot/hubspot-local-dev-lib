import { ReadStream } from 'fs';
import { CoreOptions, UriOptions } from 'request';

export type RequestOptions = CoreOptions & UriOptions;

export type GetRequestOptionsOptions = {
  uri: string;
  env?: string;
  localHostOverride?: boolean;
  qs?: { portalId?: number };
  body?: {
    [key: string]: string;
  };
};

export type QueryParams = {
  [key: string]: string;
};

export type HttpOptions = GetRequestOptionsOptions & {
  query?: QueryParams;
  formData?: {
    [key: string]: string | ReadStream;
  };
};
