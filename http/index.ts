import path from 'path';
import fs from 'fs-extra';
import contentDisposition from 'content-disposition';
import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';

import { getAccountConfig } from '../config';
import { USER_AGENTS, getAxiosConfig } from './getAxiosConfig';
import { accessTokenForPersonalAccessKey } from '../lib/personalAccessKey';
import { getOauthManager } from '../lib/oauth';
import { FlatAccountFields } from '../types/Accounts';
import { AxiosConfigOptions, HttpOptions, QueryParams } from '../types/Http';
import { throwErrorWithMessage } from '../errors/standardErrors';
import { logger } from '../lib/logger';
import { i18n } from '../utils/lang';

const i18nKey = 'http.index';

export class HubSpotHttpError<T = unknown, D = unknown> extends Error {
  public status?: number;
  public response?: AxiosResponse<T, D>;
  public config?: InternalAxiosRequestConfig<D>;
  public code?: string;
  public request?: unknown;
  public statusText?: string;
  public data?: T;

  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'HubSpotHttpError';

    if (options && isAxiosError(options.cause)) {
      // Add any custom fields we feel are necessary or make our
      // collective lives easier
      this.code = options.cause.code;
      if (options.cause.response) {
        const { response } = options.cause;
        this.status = response.status;
        this.statusText = response.statusText;
        this.data = response.data;
      }

      // Add these for backwards compatibility until we have updated all the checks
      // in the CLI for the Axios implementation details and then we can remove these or
      // keep whatever we find useful in custom fields on this object
      const { response, request, config } = options.cause;
      this.response = response;
      this.request = request;
      this.config = config;
    }
  }
}

export function isHubSpotHttpError(error?: unknown): error is HubSpotHttpError {
  return !!error && error instanceof HubSpotHttpError;
}

axios.interceptors.response.use(undefined, error => {
  // Wrap all axios errors in our own Error class.  Attach the error
  // as the cause for the new error, so we maintain the stack trace
  return Promise.reject(new HubSpotHttpError(error.message, { cause: error }));
});

export function addUserAgentHeader(key: string, value: string) {
  USER_AGENTS[key] = value;
}

async function withOauth(
  accountId: number,
  accountConfig: FlatAccountFields,
  axiosConfig: AxiosRequestConfig
): Promise<AxiosRequestConfig> {
  const { headers } = axiosConfig;
  const oauth = getOauthManager(accountId, accountConfig);

  if (!oauth) {
    throwErrorWithMessage(`${i18nKey}.errors.withOauth`, { accountId });
  }

  const accessToken = await oauth.accessToken();
  return {
    ...axiosConfig,
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

async function withPersonalAccessKey(
  accountId: number,
  axiosConfig: AxiosRequestConfig
): Promise<AxiosRequestConfig> {
  const { headers } = axiosConfig;
  const accessToken = await accessTokenForPersonalAccessKey(accountId);
  return {
    ...axiosConfig,
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

function withPortalId(
  portalId: number,
  axiosConfig: AxiosRequestConfig
): AxiosRequestConfig {
  const { params } = axiosConfig;

  return {
    ...axiosConfig,
    params: {
      ...params,
      portalId,
    },
  };
}

async function withAuth(
  accountId: number,
  options: AxiosConfigOptions
): Promise<AxiosRequestConfig> {
  const accountConfig = getAccountConfig(accountId);

  if (!accountConfig) {
    throwErrorWithMessage(`${i18nKey}.errors.withAuth`, { accountId });
  }

  const { env, authType, apiKey } = accountConfig;
  const axiosConfig = withPortalId(
    accountId,
    getAxiosConfig({ env, ...options })
  );

  if (authType === 'personalaccesskey') {
    return withPersonalAccessKey(accountId, axiosConfig);
  }

  if (authType === 'oauth2') {
    return withOauth(accountId, accountConfig, axiosConfig);
  }
  const { params } = axiosConfig;

  return {
    ...axiosConfig,
    params: {
      ...params,
      hapikey: apiKey,
    },
  };
}

function addQueryParams(
  configOptions: AxiosConfigOptions,
  queryParams: QueryParams = {}
): AxiosConfigOptions {
  const { params } = configOptions;
  return {
    ...configOptions,
    params: {
      ...queryParams,
      ...params,
    },
  };
}

async function getRequest<T>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const { params, ...rest } = options;
  const axiosConfig = addQueryParams(rest, params);
  const configWithAuth = await withAuth(accountId, axiosConfig);
  const { data } = await axios<T>(configWithAuth);
  return data;
}

async function postRequest<T>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  const { data } = await axios({ ...configWithAuth, method: 'post' });
  return data;
}

async function putRequest<T>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  const { data } = await axios({ ...configWithAuth, method: 'put' });
  return data;
}

async function patchRequest<T>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  const { data } = await axios({ ...configWithAuth, method: 'patch' });
  return data;
}

async function deleteRequest<T>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  const { data } = await axios({ ...configWithAuth, method: 'delete' });
  return data;
}

function createGetRequestStream(contentType: string) {
  return async (
    accountId: number,
    options: HttpOptions,
    destPath: string
  ): Promise<AxiosResponse> => {
    const { params, ...rest } = options;
    const axiosConfig = addQueryParams(rest, params);

    // eslint-disable-next-line no-async-promise-executor
    return new Promise<AxiosResponse>(async (resolve, reject) => {
      try {
        const { headers, ...opts } = await withAuth(accountId, axiosConfig);
        const res = await axios({
          method: 'get',
          ...opts,
          headers: {
            ...headers,
            accept: contentType,
          },
          responseType: 'stream',
        });
        if (res.status >= 200 && res.status < 300) {
          let filepath = destPath;

          if (fs.existsSync(destPath)) {
            const stat = fs.statSync(destPath);
            if (stat.isDirectory()) {
              const { parameters } = contentDisposition.parse(
                res.headers['content-disposition'] || ''
              );
              filepath = path.join(destPath, parameters.filename);
            }
          }
          try {
            fs.ensureFileSync(filepath);
          } catch (err) {
            reject(err);
          }
          const writeStream = fs.createWriteStream(filepath, {
            encoding: 'binary',
          });
          res.data.pipe(writeStream);

          writeStream.on('error', err => {
            reject(err);
          });
          writeStream.on('close', async () => {
            logger.log(
              i18n(`${i18nKey}.createGetRequestStream.onWrite`, {
                filepath,
              })
            );
            resolve(res);
          });
        } else {
          reject(res);
        }
      } catch (err) {
        reject(err);
      }
    });
  };
}

const getOctetStream = createGetRequestStream('application/octet-stream');

const http = {
  get: getRequest,
  post: postRequest,
  put: putRequest,
  patch: patchRequest,
  delete: deleteRequest,
  getOctetStream,
};

export default http;
