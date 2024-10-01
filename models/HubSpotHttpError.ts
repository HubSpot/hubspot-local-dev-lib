import { isAxiosError, AxiosError } from 'axios';
import { HubSpotHttpErrorContext, ValidationError } from '../types/Error';
import { HttpMethod } from '../types/Api';
import { HTTP_METHOD_PREPOSITIONS, HTTP_METHOD_VERBS } from '../constants/api';
import { i18n } from '../utils/lang';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HubSpotHttpError<T = any> extends Error {
  public status?: number;
  public code?: string;
  public statusText?: string;
  public data?: T;
  public headers?: { [key: string]: unknown };
  public method: string | undefined;
  public context: HubSpotHttpErrorContext | undefined;
  public derivedContext: HubSpotHttpErrorContext | undefined;
  public validationErrors: string[] | undefined;
  public detailedMessage?: string;
  private divider = `\n- `;
  public cause: ErrorOptions['cause'];

  constructor(
    message?: string,
    options?: ErrorOptions,
    context?: HubSpotHttpErrorContext
  ) {
    super(message, options);
    this.name = 'HubSpotHttpError';
    this.context = context;
    this.cause = options?.cause;

    if (options && isAxiosError(options.cause)) {
      this.extractDerivedContext(options.cause);
      const { response, config, code } = options.cause;
      this.message = this.joinErrorMessages(options.cause, {
        accountId: this.context?.accountId || this.derivedContext?.accountId,
      });
      this.detailedMessage = this.joinErrorMessages(
        options.cause,
        this.context
      );

      this.code = code;
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
      const messages =
        options.cause.name !== 'Error' ? [`${options.cause.name}:`] : [];

      if (options.cause.message) {
        messages.push(options.cause.message);
      }

      if ('reason' in options.cause && options.cause.reason) {
        messages.push(`${options.cause.reason}`);
      }

      this.message = messages.join(' ');
    }
  }

  public updateContext(context: Partial<HubSpotHttpErrorContext>) {
    this.context = { ...this.context, ...context };
    // Update the error messages when the context is updated
    if (isAxiosError(this.cause)) {
      this.message = this.joinErrorMessages(this.cause, this.context);
    }
  }

  public toString() {
    const messages = [
      `${this.name}: ${this.divider}message: ${this.detailedMessage}`,
    ];
    ['status', 'statusText', 'method', 'code'].forEach(field => {
      if (Object.hasOwn(this, field)) {
        // @ts-expect-error this[field] exists, so we know it is a property of this
        messages.push(`${field}: ${this[field]}`);
      }
    });

    if (this.validationErrors && this.validationErrors.length > 0) {
      messages.push(`errors: ${this.formattedValidationErrors()}`);
    }
    if (this.context) {
      messages.push(`context: ${JSON.stringify(this.context, undefined, 2)}`);
    }
    if (this.derivedContext) {
      messages.push(
        `derivedContext: ${JSON.stringify(this.derivedContext, undefined, 2)}`
      );
    }

    return messages.join(this.divider);
  }

  public formattedValidationErrors(): string {
    if (!this.validationErrors || this.validationErrors?.length === 0) {
      return '';
    }
    return this.validationErrors?.join(this.divider);
  }

  private extractDerivedContext(cause: AxiosError) {
    const generatedContext: HubSpotHttpErrorContext = {};
    if (!cause) {
      return;
    }

    generatedContext.accountId = cause.config?.params?.portalId;
    generatedContext.payload = JSON.stringify(cause.config?.data);
    // This will just be the url path
    generatedContext.request = cause.config?.url;

    // Allow the provided context to override the generated context
    this.derivedContext = { ...this.derivedContext, ...generatedContext };
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

        if (error.context?.requiredScopes) {
          // Sometimes the scopes come back with duplicates
          const scopes = new Set<string>(error.context.requiredScopes);
          scopes.forEach(item => {
            errorMessage = `${errorMessage}\n  - ${item}`;
          });
        } else if (error.errorTokens && error.errorTokens.line) {
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
  ): string {
    const i18nKey = 'errors.apiErrors';
    const status = error.response?.status;
    const method = error.config?.method as HttpMethod;

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

    switch (status) {
      case 400:
        errorMessage.push(i18n(`${i18nKey}.codes.400`, { messageDetail }));
        break;
      case 401:
        errorMessage.push(i18n(`${i18nKey}.codes.401`, { messageDetail }));
        break;
      case 403:
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

      if (message) {
        errorMessage.push(message);
      }

      (errors || []).forEach(err => {
        if (err.message) {
          errorMessage.push(`${this.divider}${err.message}`);
        }
      });
    }

    return errorMessage.join(' ');
  }
}
