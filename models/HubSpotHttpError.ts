import {
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
  RawAxiosResponseHeaders,
  AxiosResponseHeaders,
  Method,
  AxiosError,
} from 'axios';
import {
  extractErrorMessage,
  isGatingError,
  isMissingScopeError,
} from '../errors';
import {
  FileSystemErrorContext,
  HubSpotHttpErrorContext,
  ValidationError,
} from '../types/Error';
import { HttpMethod } from '../types/Api';
import { HTTP_METHOD_PREPOSITIONS, HTTP_METHOD_VERBS } from '../constants/api';
import { i18n } from '../utils/lang';
import { logger } from '../lib/logger';

// TODO[JOE] Write tests for this error
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
    context?: HubSpotHttpErrorContext
  ) {
    super(message, options);
    this.name = 'HubSpotHttpError';
    this.context = context;

    if (options && isAxiosError(options.cause)) {
      this.updateContextFromCause(options.cause, context);
      const { response, request, config, code } = options.cause;
      this.joinErrorMessages(options.cause, context);
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
        this.parseValidationErrors(response.data);
      }
    } else if (options && options.cause instanceof Error) {
      this.message = extractErrorMessage(options.cause);
    }
  }

  public updateContext(context: Partial<HubSpotHttpErrorContext>) {
    this.context = { ...this.context, ...context };
  }

  public toString() {
    let baseString = `${this.name}: \n- message: ${this.message}`;
    if (this.validationErrors && this.validationErrors.length > 0) {
      baseString = `${baseString} \n- errors: ${this.validationErrors.join('\n- ')}`;
    }
    if (this.context) {
      baseString = `${baseString} \n- context: ${JSON.stringify(this.context, undefined, 2)}`;
    }
    return baseString;
  }

  private updateContextFromCause(
    cause: AxiosError,
    context?: HubSpotHttpErrorContext
  ) {
    const generatedContext: HubSpotHttpErrorContext = {};
    if (!cause) {
      return;
    }

    try {
      generatedContext.accountId = cause.config?.params?.portalId;
      generatedContext.payload = JSON.stringify(cause.config?.data);
      // This will just be the url path
      generatedContext.request = cause.config?.url;
    } catch (e) {
      logger.debug(e);
    }

    // Allow the provided context to override the generated context
    this.context = { ...generatedContext, ...context };
  }

  private parseValidationErrors(
    responseData: {
      errors?: Array<ValidationError>;
      message?: string;
    } = { errors: [], message: '' }
  ): void {
    if (!responseData) {
      return;
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

    this.validationErrors = errorMessages;
  }

  private joinErrorMessages(
    error: AxiosError<{ message: string; errors: { message: string }[] }>,
    context: HubSpotHttpErrorContext = {}
  ): void {
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
        // TODO: Move projects specific errors to CLI in follow up
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
          errorMessage.push(
            i18n(`${i18nKey}.codes.generic`, { messageDetail })
          );
        }
        break;
    }

    if (error?.response?.data) {
      const { message, errors } = error.response.data;

      if (message && !isProjectMissingScopeError && !isProjectGatingError) {
        errorMessage.push(message);
      }

      (errors || []).forEach(err => {
        if (err.message) {
          errorMessage.push('\n- ' + err.message);
        }
      });
    }

    this.message = errorMessage.join(' ');
  }
}
