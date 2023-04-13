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

export interface SystemError extends BaseError {
  errno: number;
  code: string;
  syscall: string;
}

export interface StatusCodeError extends SystemError {
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
  };
}

export type ErrorContext = {
  accountId?: number;
};

export interface FileSystemErrorContext extends ErrorContext {
  filepath?: string;
  read?: boolean;
  write?: boolean;
}

export interface GithubError extends BaseError {
  error: {
    message?: string;
  };
}
