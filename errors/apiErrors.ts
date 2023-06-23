import { StatusCodeError, StatusCodeErrorContext } from '../types/Error';

// @TODO Finish this up (see logApiStatusCodeError in cli-lib)
export function throwStatusCodeError(
  error: StatusCodeError,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: StatusCodeErrorContext = {}
): never {
  const { statusCode, message, response } = error;
  const errorData = JSON.stringify({
    statusCode,
    message,
    url: response.request.href,
    method: response.request.method,
    response: response.body,
    headers: response.headers,
  });
  throw new Error(errorData, { cause: error });
}
