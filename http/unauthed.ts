import axios from 'axios';
import { getAxiosConfig } from './getAxiosConfig';
import { addQueryParams } from './addQueryParams';
import { HttpOptions } from '../types/Http';
import { HubSpotResponse } from './index';

async function getRequest<T>(options: HttpOptions): HubSpotResponse<T> {
  const { params, ...rest } = options;
  const optionsWithParams = addQueryParams(rest, params);
  const requestConfig = await getAxiosConfig(optionsWithParams);

  return axios<T>(requestConfig);
}

async function postRequest<T>(options: HttpOptions): HubSpotResponse<T> {
  const requestConfig = await getAxiosConfig(options);
  return axios<T>({ ...requestConfig, method: 'post' });
}

async function putRequest<T>(options: HttpOptions): HubSpotResponse<T> {
  const requestConfig = await getAxiosConfig(options);
  return axios<T>({ ...requestConfig, method: 'put' });
}

async function patchRequest<T>(options: HttpOptions): HubSpotResponse<T> {
  const requestConfig = await getAxiosConfig(options);
  return axios<T>({ ...requestConfig, method: 'patch' });
}

async function deleteRequest<T>(options: HttpOptions): HubSpotResponse<T> {
  const requestConfig = await getAxiosConfig(options);
  return axios<T>({ ...requestConfig, method: 'delete' });
}

export const http = {
  get: getRequest,
  post: postRequest,
  put: putRequest,
  patch: patchRequest,
  delete: deleteRequest,
};
