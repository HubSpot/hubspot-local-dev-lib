import { AxiosPromise } from 'axios';
import http from '../http';
import { QueryParams } from '../types/Http';
import { GetBuildStatusResponse, GetRoutesResponse } from '../types/Functions';

const FUNCTION_API_PATH = 'cms/v3/functions';

export function getRoutes(accountId: number): AxiosPromise<GetRoutesResponse> {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/routes`,
  });
}

export function getFunctionLogs(
  accountId: number,
  route: string,
  params: QueryParams = {}
): AxiosPromise {
  const { limit = 5 } = params;

  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/results/by-route/${encodeURIComponent(route)}`,
    params: { ...params, limit },
  });
}

export function getLatestFunctionLog(
  accountId: number,
  route: string
): AxiosPromise {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/results/by-route/${encodeURIComponent(
      route
    )}/latest`,
  });
}

export function buildPackage(
  accountId: number,
  folderPath: string
): AxiosPromise<string> {
  return http.post(accountId, {
    url: `${FUNCTION_API_PATH}/build/async`,
    headers: {
      Accept: 'text/plain',
    },
    data: {
      folderPath,
    },
  });
}

export function getBuildStatus(
  accountId: number,
  buildId: number
): AxiosPromise<GetBuildStatusResponse> {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/build/${buildId}/poll`,
  });
}
