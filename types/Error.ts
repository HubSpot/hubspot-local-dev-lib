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
  status?: number;
  error?: BaseError;
  errors?: Array<BaseError>;
}

export interface ValidationError extends BaseError {
  errorTokens?: {
    line: number;
  };
}

export type FileSystemErrorContext = {
  filepath?: string;
  write?: boolean;
  read?: boolean;
  accountId?: number;
  dest?: string;
};

export type AxiosErrorContext = {
  accountId?: number;
  request?: string;
  payload?: string;
  projectName?: string;
};

export type OptionalError = BaseError | null | undefined;
