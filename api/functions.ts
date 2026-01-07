import { http } from '../http/index.js';
import { HubSpotPromise, QueryParams } from '../types/Http.js';
import {
  GetBuildStatusResponse,
  FunctionLog,
  GetRoutesResponse,
  GetFunctionLogsResponse,
} from '../types/Functions.js';

const FUNCTION_API_PATH = 'cms/v3/functions';

export function getRoutes(
  accountId: number
): HubSpotPromise<GetRoutesResponse> {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/routes`,
  });
}

export function getFunctionLogs(
  accountId: number,
  route: string,
  params: QueryParams = {}
): HubSpotPromise<GetFunctionLogsResponse> {
  const { limit = 5 } = params;

  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/results/by-route/${encodeURIComponent(route)}`,
    params: { ...params, limit },
  });
}

export function getLatestFunctionLog(
  accountId: number,
  route: string
): HubSpotPromise<FunctionLog> {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/results/by-route/${encodeURIComponent(
      route
    )}/latest`,
  });
}

export function buildPackage(
  accountId: number,
  folderPath: string
): HubSpotPromise<string> {
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
): HubSpotPromise<GetBuildStatusResponse> {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/build/${buildId}/poll`,
  });
}
