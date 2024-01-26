import path from 'path';
import fs from 'fs-extra';
import contentDisposition from 'content-disposition';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import { getAccountConfig } from '../config';
import { getAxiosConfig } from './getAxiosConfig';
import { accessTokenForPersonalAccessKey } from '../lib/personalAccessKey';
import { getOauthManager } from '../lib/oauth';
import { FlatAccountFields } from '../types/Accounts';
import { LogCallbacksArg } from '../types/LogCallbacks';
import { AxiosConfigOptions, HttpOptions, QueryParams } from '../types/Http';
import { AxiosErrorContext } from '../types/Error';
import { throwErrorWithMessage } from '../errors/standardErrors';
import { throwApiError } from '../errors/apiErrors';
import { makeTypedLogger } from '../utils/logger';

const i18nKey = 'http.index';

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

async function axiosRequestWithErrorHandling<T>(
  config: AxiosRequestConfig,
  context: AxiosErrorContext
) {
  let result;
  try {
    result = await axios<T>(config);
  } catch (error) {
    throwApiError(error as AxiosError, context);
  }
  return result;
}

async function getRequest<T>(
  accountId: number,
  options: HttpOptions,
  errorContext: AxiosErrorContext = {}
): Promise<T> {
  const { query, ...rest } = options;
  const axiosConfig = addQueryParams(rest, query);
  const configWithAuth = await withAuth(accountId, axiosConfig);
  const { data } = await axiosRequestWithErrorHandling<T>(configWithAuth, {
    accountId,
    ...errorContext,
  });
  return data;
}

async function postRequest<T>(
  accountId: number,
  options: HttpOptions,
  errorContext: AxiosErrorContext = {}
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  const { data } = await axiosRequestWithErrorHandling<T>(
    {
      ...configWithAuth,
      method: 'post',
    },
    { accountId, ...errorContext }
  );
  return data;
}

async function putRequest<T>(
  accountId: number,
  options: HttpOptions,
  errorContext: AxiosErrorContext = {}
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  const { data } = await axiosRequestWithErrorHandling<T>(
    {
      ...configWithAuth,
      method: 'put',
    },
    { accountId, ...errorContext }
  );
  return data;
}

async function patchRequest<T>(
  accountId: number,
  options: HttpOptions,
  errorContext: AxiosErrorContext = {}
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  const { data } = await axiosRequestWithErrorHandling<T>(
    {
      ...configWithAuth,
      method: 'put', //TODO should this be patch?
    },
    { accountId, ...errorContext }
  );
  return data;
}

async function deleteRequest<T>(
  accountId: number,
  options: HttpOptions,
  errorContext: AxiosErrorContext = {}
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  const { data } = await axiosRequestWithErrorHandling<T>(
    {
      ...configWithAuth,
      method: 'delete',
    },
    { accountId, ...errorContext }
  );
  return data;
}

const getRequestStreamCallbackKeys = ['onWrite'] as const;

function createGetRequestStream(contentType: string) {
  return async (
    accountId: number,
    options: HttpOptions,
    destPath: string,
    logCallbacks?: LogCallbacksArg<typeof getRequestStreamCallbackKeys>
  ): Promise<AxiosResponse> => {
    const { query, ...rest } = options;
    const axiosConfig = addQueryParams(rest, query);
    const logger =
      makeTypedLogger<typeof getRequestStreamCallbackKeys>(logCallbacks);

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
            logger('onWrite', `${i18nKey}.createGetRequestStream.onWrite`, {
              filepath,
            });
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
