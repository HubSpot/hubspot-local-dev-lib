import path from 'path';
import request from 'request';
import requestPN from 'request-promise-native';
import fs from 'fs-extra';
import contentDisposition from 'content-disposition';

import CLIConfiguration from '../config/CLIConfiguration';
import { getRequestOptions } from './requestOptions';
import { accessTokenForPersonalAccessKey } from '../lib/personalAccessKey';
import { getOauthManager } from '../lib/oauth';
import { throwFileSystemError } from '../errors/fileSystemErrors';
import { FileSystemErrorContext } from '../types/Error';
import { FlatAccountFields } from '../types/Accounts';
import { GetRequestOptionsOptions, RequestOptions } from '../types/Http';
import { throwErrorWithMessage } from '../errors/standardErrors';

async function withOauth(
  accountId: number,
  accountConfig: FlatAccountFields,
  requestOptions: RequestOptions
): Promise<RequestOptions> {
  const { headers } = requestOptions;
  const oauth = getOauthManager(accountId, accountConfig);

  if (!oauth) {
    throwErrorWithMessage('http.index.withOauth', { accountId });
  }

  const accessToken = await oauth.accessToken();
  return {
    ...requestOptions,
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

async function withPersonalAccessKey(
  accountId: number,
  requestOptions: RequestOptions
): Promise<RequestOptions> {
  const { headers } = requestOptions;
  const accessToken = await accessTokenForPersonalAccessKey(accountId);
  return {
    ...requestOptions,
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

function withPortalId(
  portalId: number,
  requestOptions: RequestOptions
): RequestOptions {
  const { qs } = requestOptions;

  return {
    ...requestOptions,
    qs: {
      ...qs,
      portalId,
    },
  };
}

async function withAuth(
  accountId: number,
  options: GetRequestOptionsOptions
): Promise<RequestOptions> {
  const accountConfig = CLIConfiguration.getAccount(accountId);

  if (!accountConfig) {
    throwErrorWithMessage('http.index.withAuth', { accountId });
  }

  const { env, authType, apiKey } = accountConfig;
  const requestOptions = withPortalId(
    accountId,
    getRequestOptions({ env, ...options })
  );

  if (authType === 'personalaccesskey') {
    return withPersonalAccessKey(accountId, requestOptions);
  }

  if (authType === 'oauth2') {
    return withOauth(accountId, accountConfig, requestOptions);
  }
  const { qs } = requestOptions;

  return {
    ...requestOptions,
    qs: {
      ...qs,
      hapikey: apiKey,
    },
  };
}

type QueryParams = {
  [key: string]: string;
};

function addQueryParams(
  requestOptions: GetRequestOptionsOptions,
  params: QueryParams = {}
): GetRequestOptionsOptions {
  const { qs } = requestOptions;
  return {
    ...requestOptions,
    qs: {
      ...qs,
      ...params,
    },
  };
}

type GetRequestOptionsOptionsWithQuery = GetRequestOptionsOptions & {
  query: QueryParams;
};

async function getRequest(
  accountId: number,
  options: GetRequestOptionsOptionsWithQuery
) {
  const { query, ...rest } = options;
  const requestOptions = addQueryParams(rest, query);
  const requestOptionsWithAuth = await withAuth(accountId, requestOptions);
  return requestPN.get(requestOptionsWithAuth);
}

async function postRequest(
  accountId: number,
  options: GetRequestOptionsOptionsWithQuery
) {
  const requestOptionsWithAuth = await withAuth(accountId, options);
  return requestPN.post(requestOptionsWithAuth);
}

async function putRequest(
  accountId: number,
  options: GetRequestOptionsOptionsWithQuery
) {
  const requestOptionsWithAuth = await withAuth(accountId, options);
  return requestPN.put(requestOptionsWithAuth);
}

async function patchRequest(
  accountId: number,
  options: GetRequestOptionsOptionsWithQuery
) {
  const requestOptionsWithAuth = await withAuth(accountId, options);
  return requestPN.patch(requestOptionsWithAuth);
}

async function deleteRequest(
  accountId: number,
  options: GetRequestOptionsOptionsWithQuery
) {
  const requestOptionsWithAuth = await withAuth(accountId, options);
  return requestPN.del(requestOptionsWithAuth);
}

const createGetRequestStream =
  ({ contentType }) =>
  async (accountId, options, destPath) => {
    const { query, ...rest } = options;
    const requestOptions = addQueryParams(rest, query);

    const logFsError = err => {
      logFileSystemErrorInstance(
        err,
        new FileSystemErrorContext({
          destPath,
          accountId,
          write: true,
        })
      );
    };

    // Using `request` instead of `request-promise` per the docs so
    // the response can be piped.
    // https://github.com/request/request-promise#api-in-detail
    //
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const { headers, ...opts } = await withAuth(accountId, requestOptions);
        const req = request.get({
          ...opts,
          headers: {
            ...headers,
            accept: contentType,
          },
          json: false,
        });
        req.on('error', reject);
        req.on('response', res => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            let filepath = destPath;

            if (fs.existsSync(destPath)) {
              const stat = fs.statSync(destPath);
              if (stat.isDirectory()) {
                const { parameters } = contentDisposition.parse(
                  res.headers['content-disposition']
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
              logFsError(err);
              reject(err);
            });
            writeStream.on('close', async () => {
              logger.log('Wrote file "%s"', filepath);
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

module.exports = {
  getRequestOptions,
  request: requestPN,
  get: getRequest,
  getOctetStream: createGetRequestStream({
    contentType: 'application/octet-stream',
  }),
  post: postRequest,
  put: putRequest,
  patch: patchRequest,
  delete: deleteRequest,
};
