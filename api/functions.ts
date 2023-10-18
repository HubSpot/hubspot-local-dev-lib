import http from '../http';
// import { QueryParams } from '../types/Http';
import { GetBuildStatusResponse, GetRoutesResponse } from '../types/Functions';
const FUNCTION_API_PATH = 'cms/v3/functions';

export async function getRoutes(accountId: number): Promise<GetRoutesResponse> {
  return http.get(accountId, {
    url: `${FUNCTION_API_PATH}/routes`,
  });
}

export async function buildPackage(
  accountId: number,
  folderPath: string
): Promise<string> {
  return http.post(accountId, {
    url: `${FUNCTION_API_PATH}/build/async`,
    headers: {
      Accept: 'text/plain',
    },
    body: {
      folderPath,
    },
  });
}

export async function getBuildStatus(
  portalId: number,
  buildId: number
): Promise<GetBuildStatusResponse> {
  return http.get(portalId, {
    url: `${FUNCTION_API_PATH}/build/${buildId}/poll`,
  });
}
