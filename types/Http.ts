import { ResponseType } from 'axios';
import { ReadStream } from 'fs';
import { Stream } from 'stream';

export type Data = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type QueryParams = {
  [key: string]: string | number | boolean | undefined;
};

export type FormData = {
  [key: string]: string | ReadStream;
};

export type HttpOptions = {
  baseURL?: string;
  url: string;
  env?: string;
  localHostOverride?: boolean;
  data?:
    | Data
    | string
    | ArrayBuffer
    | ArrayBufferView
    | URLSearchParams
    | Stream
    | Buffer;
  resolveWithFullResponse?: boolean;
  params?: QueryParams;
  timeout?: number;
  responseType?: ResponseType;
  headers?: { [header: string]: string | string[] | undefined };
  unauthed?: boolean;
};
