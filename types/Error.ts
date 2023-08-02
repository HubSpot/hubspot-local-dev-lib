import { HttpMethod } from './Api';

// See https://nodejs.org/api/errors.html#class-systemerror
export interface BaseError extends Error {
  name: string;
  message: string;
  errno?: number | null;
  code?: string | null;
  syscall?: string | null;
  reason?: string;
  statusCode?: number;
}

export interface StatusCodeError extends BaseError {
  name: 'StatusCodeError';
  statusCode: number;
  message: string;
  response: {
    request: {
      href: string;
      method: string;
    };
    body: {
      [key: string]: string;
    };
    headers: {
      [key: string]: string;
    };
    statusCode: number;
  };
  options?: {
    method: HttpMethod;
  };
  error?: {
    category: string;
    message: string;
  };
}

export interface GithubError extends BaseError {
  error: {
    message?: string;
  };
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
