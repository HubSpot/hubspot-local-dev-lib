import { httpClient } from './client.js';
import { getAxiosConfig } from './getAxiosConfig.js';
import { addQueryParams } from './addQueryParams.js';
import { HttpOptions, HubSpotPromise } from '../types/Http.js';

async function getRequest<T>(options: HttpOptions): HubSpotPromise<T> {
  const { params, ...rest } = options;
  const optionsWithParams = addQueryParams(rest, params);
  const requestConfig = await getAxiosConfig(optionsWithParams);

  return httpClient<T>(requestConfig);
}

async function postRequest<T>(options: HttpOptions): HubSpotPromise<T> {
  const requestConfig = await getAxiosConfig(options);
  return httpClient<T>({ ...requestConfig, method: 'post' });
}

async function putRequest<T>(options: HttpOptions): HubSpotPromise<T> {
  const requestConfig = await getAxiosConfig(options);
  return httpClient<T>({ ...requestConfig, method: 'put' });
}

async function patchRequest<T>(options: HttpOptions): HubSpotPromise<T> {
  const requestConfig = await getAxiosConfig(options);
  return httpClient<T>({ ...requestConfig, method: 'patch' });
}

async function deleteRequest<T>(options: HttpOptions): HubSpotPromise<T> {
  const requestConfig = await getAxiosConfig(options);
  return httpClient<T>({ ...requestConfig, method: 'delete' });
}

export const http = {
  get: getRequest,
  post: postRequest,
  put: putRequest,
  patch: patchRequest,
  delete: deleteRequest,
};
