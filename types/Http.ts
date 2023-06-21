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
