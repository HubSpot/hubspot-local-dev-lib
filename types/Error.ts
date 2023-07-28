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

export type Error = {
  category: string;
  context: {
    FILE_NAME?: Array<string>;
    FILE_PATH?: Array<string>;
    filepath?: string;
  };
  message?: string;
  status: string;
  subCategory: string;
  responseJSON?: {
    message?: string;
  };
  errors?: Array<Error>;
};

export type OptionalError = Error | null | undefined;
