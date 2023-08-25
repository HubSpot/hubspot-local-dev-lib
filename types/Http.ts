import { ReadStream } from 'fs';
import { Row, Schema } from './Hubdb';

export type Body = { [key: string]: string | number | boolean | Body | Row[] };

export type AxiosConfigOptions = {
  url: string;
  env?: string;
  localHostOverride?: boolean;
  params?: {
    portalId?: number;
    buffer?: boolean;
    environmentId?: number;
    version?: string;
    hidden?: number;
    offset?: number;
    folder_id?: number;
    parent_folder_id?: number;
  };
  body?: Body | JSON | Schema;
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
