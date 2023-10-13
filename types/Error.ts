import { HttpMethod } from './Api';

export interface GenericError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
// See https://nodejs.org/api/errors.html#class-systemerror
export interface BaseError extends Error {
  name: string;
  message: string;
  errno?: number | null;
  code?: string | null;
  syscall?: string | null;
  reason?: string;
  statusCode?: number;
  error?: BaseError;
  errors?: Array<BaseError>;
}

export interface StatusCodeError extends BaseError {
  name: string;
  statusCode?: number;
  message: string;
  category?: string;
  subCategory?: string;
  response: {
    request: {
      href: string;
      method: string;
    };
    body: {
      message?: string;
      errors?: Array<StatusCodeError>;
      category?: string;
      subCategory?: string;
    };
    headers: {
      [key: string]: string;
    };
    statusCode: number;
  };
  options?: {
    method: HttpMethod;
  };
  errorTokens?: {
    line: number;
  };
  error?: StatusCodeError;
  errors?: Array<StatusCodeError>;
}

export type FileSystemErrorContext = {
  filepath: string;
  write?: boolean;
  read?: boolean;
  accountId?: number;
};

export type StatusCodeErrorContext = {
  accountId?: number;
  request?: string;
  payload?: string;
  projectName?: string;
};

export type OptionalError = BaseError | null | undefined;
