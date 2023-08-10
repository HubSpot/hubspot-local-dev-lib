import path from 'path';
import request from 'request';
import requestPN, { FullResponse } from 'request-promise-native';
import fs from 'fs-extra';
import contentDisposition from 'content-disposition';

import { getAccountConfig } from '../config';
import { getAxiosConfig } from './getAxiosConfig';
import { accessTokenForPersonalAccessKey } from '../lib/personalAccessKey';
import { getOauthManager } from '../lib/oauth';
import { FlatAccountFields } from '../types/Accounts';
import { LogCallbacksArg } from '../types/LogCallbacks';
import { AxiosConfigOptions, HttpOptions, QueryParams } from '../types/Http';
import { throwErrorWithMessage } from '../errors/standardErrors';
import { makeTypedLogger } from '../utils/logger';
import { Axios, AxiosRequestConfig } from 'axios';

async function withOauth(
  accountId: number,
  accountConfig: FlatAccountFields,
  axiosConfig: AxiosRequestConfig
): Promise<AxiosRequestConfig> {
  const { headers } = axiosConfig;
  const oauth = getOauthManager(accountId, accountConfig);

  if (!oauth) {
    throwErrorWithMessage('http.index.withOauth', { accountId });
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
    throwErrorWithMessage('http.index.withAuth', { accountId });
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

async function getRequest<T = FullResponse>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const { query, ...rest } = options;
  const axiosConfig = addQueryParams(rest, query);
  const configWithAuth = await withAuth(accountId, axiosConfig);
  return requestPN.get(configWithAuth);
}

async function postRequest<T = FullResponse>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  return requestPN.post(configWithAuth);
}

async function putRequest<T = FullResponse>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  return requestPN.put(configWithAuth);
}

async function patchRequest<T = FullResponse>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  return requestPN.patch(configWithAuth);
}

async function deleteRequest<T = FullResponse>(
  accountId: number,
  options: HttpOptions
): Promise<T> {
  const configWithAuth = await withAuth(accountId, options);
  return requestPN.del(configWithAuth);
}

const getRequestStreamCallbackKeys = ['onWrite'];

function createGetRequestStream(contentType: string) {
  return async (
    accountId: number,
    options: HttpOptions,
    destPath: string,
    logCallbacks?: LogCallbacksArg<typeof getRequestStreamCallbackKeys>
  ): Promise<FullResponse> => {
    const { query, ...rest } = options;
    const axiosConfig = addQueryParams(rest, query);
    const logger = makeTypedLogger<typeof getRequestStreamCallbackKeys>(
      logCallbacks,
      'http.index.createGetRequestStream'
    );

    // Using `request` instead of `request-promise` per the docs so
    // the response can be piped.
    // https://github.com/request/request-promise#api-in-detail
    //
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<FullResponse>(async (resolve, reject) => {
      try {
        const { headers, ...opts } = await withAuth(accountId, axiosConfig);
        const req = request.get({
          ...opts,
          headers: {
            ...headers,
            accept: contentType,
          },
          responseType: 'stream',
        });
        req.on('error', reject);
        req.on('response', res => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
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
            req.pipe(writeStream);

            writeStream.on('error', err => {
              reject(err);
            });
            writeStream.on('close', async () => {
              logger('onWrite', { filepath });
              resolve(res);
            });
          } else {
            reject(res);
          }
        });
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
