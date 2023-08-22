import { ReadStream } from 'fs';

type Body = { [key: string]: string | number | boolean | Body };

export type AxiosConfigOptions = {
  url?: string;
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
  uri?: string;
  qs?: {
    hidden?: number;
    offset?: number;
    folder_id?: number;
    parent_folder_id?: number;
  };
};
