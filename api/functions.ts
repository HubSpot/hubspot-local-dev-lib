import { http, HubSpotResponse } from '../http';
import { QueryParams } from '../types/Http';
import { GetBuildStatusResponse, GetRoutesResponse } from '../types/Functions';

const FUNCTION_API_PATH = 'cms/v3/functions';

export function getRoutes(
  accountId: number
): HubSpotResponse<GetRoutesResponse> {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/routes`,
  });
}

export function getFunctionLogs(
  accountId: number,
  route: string,
  params: QueryParams = {}
): HubSpotResponse {
  const { limit = 5 } = params;

  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/results/by-route/${encodeURIComponent(route)}`,
    params: { ...params, limit },
  });
}

export function getLatestFunctionLog(
  accountId: number,
  route: string
): HubSpotResponse {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/results/by-route/${encodeURIComponent(
      route
    )}/latest`,
  });
}

export function buildPackage(
  accountId: number,
  folderPath: string
): HubSpotResponse<string> {
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
): HubSpotResponse<GetBuildStatusResponse> {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/build/${buildId}/poll`,
  });
}
