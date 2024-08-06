import http from '../http';
import { QueryParams } from '../types/Http';
import { GetBuildStatusResponse, GetRoutesResponse } from '../types/Functions';

const APP_FUNCTION_API_PATH = '/app-functions';
const CMS_FUNCTION_API_PATH = 'cms/v3/functions';
const DEVELOPER_API_PATH = 'developer/platform/logging';

export async function getRoutes(accountId: number): Promise<GetRoutesResponse> {
  return http.get(accountId, {
    url: `${CMS_FUNCTION_API_PATH}/routes`,
  });
}

export async function getAppFunctions(accountId: number, appId: number) {
  return http.get(accountId, {
    url: `${APP_FUNCTION_API_PATH}/${appId}/functions`,
  });
}

export async function getFunctionLogs(
  accountId: number,
  route: string,
  params: QueryParams = {}
) {
  const { limit = 5 } = params;

  return http.get(accountId, {
    url: `${CMS_FUNCTION_API_PATH}/results/by-route/${encodeURIComponent(route)}`,
    params: { ...params, limit },
  });
}

export async function getLatestFunctionLog(accountId: number, route: string) {
  return http.get(accountId, {
    url: `${CMS_FUNCTION_API_PATH}/results/by-route/${encodeURIComponent(
      route
    )}/latest`,
  });
}

export async function getPublicFunctionLogs(
  accountId: number,
  functionName: string,
  projectName: string,
  appPath: string,
  params: QueryParams = {}
) {
  const { limit = 5 } = params;
  return http.get(accountId, {
    url: `${CMS_FUNCTION_API_PATH}/app-function/logs/project/${projectName}/function/${functionName}`,
    params: { appPath, ...params, limit },
  });
}

export async function getLatestPublicFunctionLogs(
  accountId: number,
  functionName: string,
  projectName: string,
  appPath: string
) {
  return http.get(accountId, {
    url: `${CMS_FUNCTION_API_PATH}/app-function/logs/project/${projectName}/function/${functionName}/latest`,
    params: { appPath },
  });
}

export async function getAppLogs(accountId: number, appId: string) {
  return http.post(accountId, {
    url: `${DEVELOPER_API_PATH}/search`,
    data: { appId },
  });
}

export async function buildPackage(
  accountId: number,
  folderPath: string
): Promise<string> {
  return http.post(accountId, {
    url: `${CMS_FUNCTION_API_PATH}/build/async`,
    headers: {
      Accept: 'text/plain',
    },
    data: {
      folderPath,
    },
  });
}

export async function getBuildStatus(
  accountId: number,
  buildId: number
): Promise<GetBuildStatusResponse> {
  return http.get(accountId, {
    url: `${CMS_FUNCTION_API_PATH}/build/${buildId}/poll`,
  });
}
