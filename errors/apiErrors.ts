import { StatusCodeError, StatusCodeErrorContext } from '../types/Error';
import { HTTP_METHOD_VERBS, HTTP_METHOD_PREPOSITIONS } from '../constants/api';

export function throwStatusCodeError(
  error: StatusCodeError,
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
    context,
  });
  throw new Error(errorData, { cause: error });
}

function throwApiStatusCodeError(
  error: StatusCodeError,
  context: StatusCodeErrorContext
) {
  const { statusCode } = error;
  const { method } = error.options || {};
  const { projectName } = context;
  const isPutOrPost = method === 'PUT' || method === 'POST';
  const action =
    method && (HTTP_METHOD_VERBS[method] || HTTP_METHOD_VERBS.DEFAULT);
  const preposition =
    (method && HTTP_METHOD_PREPOSITIONS[method]) ||
    HTTP_METHOD_PREPOSITIONS.DEFAULT;
  let messageDetail = '';
  {
    const request = context.request
      ? `${action} ${preposition} "${context.request}"`
      : action;
    messageDetail = `${request} in account ${context.accountId}`;
  }
  const errorMessage = [];
  if (isPutOrPost && context.payload) {
    errorMessage.push(`Unable to upload "${context.payload}".`);
  }
  const isProjectMissingScopeError = isMissingScopeError(error) && projectName;
  const isProjectGatingError = isGatingError(error) && projectName;
  switch (statusCode) {
    case 400:
      errorMessage.push(`The ${messageDetail} was bad.`);
      break;
    case 401:
      errorMessage.push(`The ${messageDetail} was unauthorized.`);
      break;
    case 403:
      if (isProjectMissingScopeError) {
        errorMessage.push(
          `Couldn't run the project command because there are scopes missing in your production account. To update scopes, deactivate your current personal access key for ${context.accountId}, and generate a new one. Then run \`hs auth\` to update the CLI with the new key.`
        );
      } else if (isProjectGatingError) {
        errorMessage.push(
          `The current target account ${context.accountId} does not have access to HubSpot projects. To opt in to the CRM Development Beta and use projects, visit https://app.hubspot.com/l/whats-new/betas?productUpdateId=13860216.`
        );
      } else {
        errorMessage.push(`The ${messageDetail} was forbidden.`);
      }
      break;
    case 404:
      if (context.request) {
        errorMessage.push(
          `The ${action} failed because "${context.request}" was not found in account ${context.accountId}.`
        );
      } else {
        errorMessage.push(`The ${messageDetail} was not found.`);
      }
      break;
    case 429:
      errorMessage.push(
        `The ${messageDetail} surpassed the rate limit. Retry in one minute.`
      );
      break;
    case 503:
      errorMessage.push(
        `The ${messageDetail} could not be handled at this time. ${contactSupportString}`
      );
      break;
    default:
      if (statusCode >= 500 && statusCode < 600) {
        errorMessage.push(
          `The ${messageDetail} failed due to a server error. ${contactSupportString}`
        );
      } else if (statusCode >= 400 && statusCode < 500) {
        errorMessage.push(`The ${messageDetail} failed due to a client error.`);
      } else {
        errorMessage.push(`The ${messageDetail} failed.`);
      }
      break;
  }
  if (
    error.error &&
    error.error.message &&
    !isProjectMissingScopeError &&
    !isProjectGatingError
  ) {
    errorMessage.push(error.error.message);
  }
  if (error.error && error.error.errors) {
    error.error.errors.forEach(err => {
      errorMessage.push('\n- ' + err.message);
    });
  }
  logger.error(errorMessage.join(' '));
  debugErrorAndContext(error, context);
}
