import path from 'path';
import fs from 'fs-extra';
import contentDisposition from 'content-disposition';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosPromise } from 'axios';

import { getAccountConfig } from '../config';
import { USER_AGENTS, getAxiosConfig } from './getAxiosConfig';
import { addQueryParams } from './addQueryParams';
import { accessTokenForPersonalAccessKey } from '../lib/personalAccessKey';
import { getOauthManager } from '../lib/oauth';
import { FlatAccountFields } from '../types/Accounts';
import { HttpOptions } from '../types/Http';
import { logger } from '../lib/logger';
import { i18n } from '../utils/lang';
import { HubSpotHttpError } from '../models/HubSpotHttpError';

const i18nKey = 'http.index';

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
    throw new Error(i18n(`${i18nKey}.errors.withOauth`, { accountId }));
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
  options: HttpOptions
): Promise<AxiosRequestConfig> {
  const accountConfig = getAccountConfig(accountId);

  if (!accountConfig) {
    throw new Error(i18n(`${i18nKey}.errors.withAuth`, { accountId }));
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

async function getRequest<T>(
  accountId: number,
  options: HttpOptions
): AxiosPromise<T> {
  const { params, ...rest } = options;
  const optionsWithParams = addQueryParams(rest, params);
  const requestConfig = await withAuth(accountId, optionsWithParams);

  return axios<T>(requestConfig);
}

async function postRequest<T>(
  accountId: number,
  options: HttpOptions
): AxiosPromise<T> {
  const requestConfig = await withAuth(accountId, options);
  return axios({ ...requestConfig, method: 'post' });
}

async function putRequest<T>(
  accountId: number,
  options: HttpOptions
): AxiosPromise<T> {
  const requestConfig = await withAuth(accountId, options);
  return axios({ ...requestConfig, method: 'put' });
}

async function patchRequest<T>(
  accountId: number,
  options: HttpOptions
): AxiosPromise<T> {
  const requestConfig = await withAuth(accountId, options);
  return axios({ ...requestConfig, method: 'patch' });
}

async function deleteRequest<T>(
  accountId: number,
  options: HttpOptions
): AxiosPromise<T> {
  const requestConfig = await withAuth(accountId, options);
  return axios({ ...requestConfig, method: 'delete' });
}

function createGetRequestStream(contentType: string) {
  return async (
    accountId: number,
    options: HttpOptions,
    destPath: string
  ): AxiosPromise => {
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

export const http = {
  get: getRequest,
  post: postRequest,
  put: putRequest,
  patch: patchRequest,
  delete: deleteRequest,
  getOctetStream,
};
