import { AxiosPromise } from 'axios';
import { http } from '../http';
import {
  PublicApp,
  PublicAppInstallCounts,
  PublicAppDeveloperTestAccountInstallData,
  FetchPublicAppsForPortalResponse,
} from '../types/Apps';

const APPS_DEV_API_PATH = 'apps-dev/external/public/v3';

export function fetchPublicAppsForPortal(
  accountId: number
): AxiosPromise<FetchPublicAppsForPortalResponse> {
  return http.get<FetchPublicAppsForPortalResponse>(accountId, {
    url: `${APPS_DEV_API_PATH}/full/portal`,
  });
}

export function fetchPublicAppDeveloperTestAccountInstallData(
  appId: number,
  accountId: number
): AxiosPromise<PublicAppDeveloperTestAccountInstallData> {
  return http.get<PublicAppDeveloperTestAccountInstallData>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/test-portal-installs`,
  });
}

export function fetchPublicAppProductionInstallCounts(
  appId: number,
  accountId: number
): AxiosPromise<PublicAppInstallCounts> {
  return http.get<PublicAppInstallCounts>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/install-counts-without-test-portals`,
  });
}

export function fetchPublicAppMetadata(
  appId: number,
  accountId: number
): AxiosPromise<PublicApp> {
  return http.get<PublicApp>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/full`,
  });
}
