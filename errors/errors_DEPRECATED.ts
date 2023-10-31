import {
  BaseError,
  FileSystemErrorContext,
  StatusCodeError,
} from '../types/Error';

type ErrorContext = {
  accountId?: number;
};

function isSystemError(err: BaseError) {
  return err.errno != null && err.code != null && err.syscall != null;
}

function debugErrorAndContext(error: BaseError, context?: ErrorContext): void {
  if (error.name === 'StatusCodeError') {
    const { status, message, response } = error as StatusCodeError;
    console.debug('Error: %o', {
      status,
      message,
      url: response.request.href,
      method: response.request.method,
      response: response.body,
      headers: response.headers,
    });
  } else {
    console.debug('Error: %o', error);
  }
  console.debug('Context: %o', context);
}

export function logErrorInstance(error: BaseError, context?: ErrorContext) {
  // SystemError
  if (isSystemError(error)) {
    console.error(`A system error has occurred: ${error.message}`);
    debugErrorAndContext(error, context);
    return;
  }
  if (
    error instanceof Error ||
    (error as BaseError).message ||
    (error as BaseError).reason
  ) {
    // Error or Error subclass
    const name = error.name || 'Error';
    const message = [`A ${name} has occurred.`];
    [error.message, error.reason].forEach(msg => {
      if (msg) {
        message.push(msg);
      }
    });
    console.error(message.join(' '));
  } else {
    // Unknown errors
    console.error(`An unknown error has occurred.`);
  }
  debugErrorAndContext(error, context);
}

export function logFileSystemErrorInstance(
  error: BaseError,
  context: FileSystemErrorContext
) {
  let fileAction = '';
  if (context.read) {
    fileAction = 'reading from';
  } else if (context.write) {
    fileAction = 'writing to';
  } else {
    fileAction = 'accessing';
  }
  const filepath = context.filepath
    ? `"${context.filepath}"`
    : 'a file or folder';
  const message = [`An error occurred while ${fileAction} ${filepath}.`];
  // Many `fs` errors will be `SystemError`s
  if (isSystemError(error)) {
    message.push(`This is the result of a system error: ${error.message}`);
  }
  console.error(message.join(' '));
  debugErrorAndContext(error, context);
}
