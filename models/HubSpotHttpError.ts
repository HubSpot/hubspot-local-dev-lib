import {
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
  RawAxiosResponseHeaders,
  AxiosResponseHeaders,
  Method,
  AxiosError,
} from 'axios';
import { isGatingError, isMissingScopeError } from '../errors';
import {
  FileSystemErrorContext,
  HubSpotHttpErrorContext,
  ValidationError,
} from '../types/Error';
import { HttpMethod } from '../types/Api';
import { HTTP_METHOD_PREPOSITIONS, HTTP_METHOD_VERBS } from '../constants/api';
import { i18n } from '../utils/lang';

export function parseValidationErrors(
  responseData: {
    errors?: Array<ValidationError>;
    message?: string;
  } = { errors: [], message: '' }
): Array<string> {
  if (!responseData) {
    return [];
  }

  const errorMessages = [];

  const { errors, message } = responseData;

  if (message) {
    errorMessages.push(message);
  }

  if (errors) {
    const specificErrors = errors.map(error => {
      let errorMessage = error.message;
      if (error.errorTokens && error.errorTokens.line) {
        errorMessage = `line ${error.errorTokens.line}: ${errorMessage}`;
      }
      return errorMessage;
    });
    errorMessages.push(...specificErrors);
  }

  return errorMessages;
}

export function joinErrorMessages(
  error: AxiosError<{ message: string; errors: { message: string }[] }>,
  context: HubSpotHttpErrorContext = {}
) {
  const i18nKey = 'errors.apiErrors';
  const status = error.response?.status;
  const method = error.config?.method as HttpMethod;
  const { projectName } = context;

  let messageDetail: string;

  if (context.accountId) {
    const action =
      (method && HTTP_METHOD_VERBS[method]) || HTTP_METHOD_VERBS.get;

    const preposition =
      (method && HTTP_METHOD_PREPOSITIONS[method]) ||
      HTTP_METHOD_PREPOSITIONS.get;

    const requestName = context.request
      ? `${action} ${preposition} '${context.request}'`
      : action;

    messageDetail = i18n(`${i18nKey}.messageDetail`, {
      accountId: context.accountId,
      requestName,
    });
  } else {
    messageDetail = i18n(`${i18nKey}.genericMessageDetail`);
  }

  const errorMessage: Array<string> = [];

  if ((method === 'put' || method === 'post') && context.payload) {
    errorMessage.push(
      i18n(`${i18nKey}.unableToUpload`, { payload: context.payload })
    );
  }
  const isProjectMissingScopeError =
    isMissingScopeError(error) && !!projectName;
  const isProjectGatingError = isGatingError(error) && !!projectName;

  switch (status) {
    case 400:
      errorMessage.push(i18n(`${i18nKey}.codes.400`, { messageDetail }));
      break;
    case 401:
      errorMessage.push(i18n(`${i18nKey}.codes.401`, { messageDetail }));
      break;
    case 403:
      if (isProjectMissingScopeError) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.403ProjectMissingScope`, {
            accountId: context.accountId || '',
          })
        );
      } else if (isProjectGatingError) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.403ProjectGating`, {
            accountId: context.accountId || '',
          })
        );
      } else {
        errorMessage.push(i18n(`${i18nKey}.codes.403`, { messageDetail }));
      }
      break;
    case 404:
      errorMessage.push(i18n(`${i18nKey}.codes.404`, { messageDetail }));
      break;
    case 429:
      errorMessage.push(i18n(`${i18nKey}.codes.429`, { messageDetail }));
      break;
    case 503:
      errorMessage.push(i18n(`${i18nKey}.codes.503`, { messageDetail }));
      break;
    default:
      if (status && status >= 500 && status < 600) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.500Generic`, { messageDetail })
        );
      } else if (status && status >= 400 && status < 500) {
        errorMessage.push(
          i18n(`${i18nKey}.codes.400Generic`, { messageDetail })
        );
      } else {
        errorMessage.push(i18n(`${i18nKey}.codes.generic`, { messageDetail }));
      }
      break;
  }

  if (error?.response?.data) {
    const { message, errors } = error.response.data;

    if (message && !isProjectMissingScopeError && !isProjectGatingError) {
      errorMessage.push(message);
    }

    if (errors) {
      errors.forEach(err => {
        if (err.message) {
          errorMessage.push('\n- ' + err.message);
        }
      });
    }
  }

  return errorMessage.join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HubSpotHttpError<T = any, D = any> extends Error {
  public status?: number;
  public response?: AxiosResponse<T, D>;
  public config?: InternalAxiosRequestConfig<D>;
  public code?: string;
  public request?: unknown;
  public statusText?: string;
  public data?: T;
  public headers?: RawAxiosResponseHeaders | AxiosResponseHeaders;
  public method: Method | string | undefined;
  public context: HubSpotHttpErrorContext | FileSystemErrorContext | undefined;
  public validationErrors: string[] | undefined;

  constructor(
    message?: string,
    options?: ErrorOptions,
    context?: HubSpotHttpErrorContext | FileSystemErrorContext
  ) {
    super(message, options);
    this.name = 'HubSpotHttpError';
    this.context = context;

    if (options && isAxiosError(options.cause)) {
      const { response, request, config, code } = options.cause;
      this.message = joinErrorMessages(options.cause, context);
      this.response = response;

      this.config = config;
      this.code = code;
      this.request = request;
      this.method = config?.method;

      // Pull the request fields to the top level
      if (response) {
        this.status = response.status;
        this.statusText = response.statusText;
        this.data = response.data;
        this.headers = response.headers;
        this.validationErrors = parseValidationErrors(response.data);
      }
    } else if (options && options.cause instanceof Error) {
      const error = options?.cause;
      const messages = error.name !== 'Error' ? [`${error.name}:`] : [];

      if (error.message) {
        messages.push(error.message);
      }

      if ('reason' in error && error.reason) {
        messages.push(`${error.reason}`);
      }

      this.message = messages.join(' ');
    }
  }

  public updateContext(
    context: HubSpotHttpErrorContext | FileSystemErrorContext
  ) {
    this.context = { ...this.context, ...context };
  }
}
