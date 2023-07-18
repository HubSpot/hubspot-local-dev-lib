const isSystemError = err =>
  err.errno != null && err.code != null && err.syscall != null;

function debugErrorAndContext(error, context) {
  if (error.name === 'StatusCodeError') {
    const { statusCode, message, response } = error;
    console.debug('Error: %o', {
      statusCode,
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

export function logErrorInstance(error, context) {
  // SystemError
  if (isSystemError(error)) {
    console.error(`A system error has occurred: ${error.message}`);
    debugErrorAndContext(error, context);
    return;
  }
  if (error instanceof Error || error.message || error.reason) {
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

export function logFileSystemErrorInstance(error, context) {
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
