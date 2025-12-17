import { http } from '../http/index.js';
import {
  PublicApp,
  PublicAppInstallCounts,
  PublicAppDeveloperTestAccountInstallData,
  FetchPublicAppsForPortalResponse,
} from '../types/Apps.js';
import { HubSpotPromise } from '../types/Http.js';

const APPS_DEV_API_PATH = 'apps-dev/external/public/v3';
const APPS_HUBLETS_API_PATH = 'apps-hublets/external/static-token/v3';

export function fetchPublicAppsForPortal(
  accountId: number
): HubSpotPromise<FetchPublicAppsForPortalResponse> {
  return http.get<FetchPublicAppsForPortalResponse>(accountId, {
    url: `${APPS_DEV_API_PATH}/full/portal`,
  });
}

export function fetchPublicAppDeveloperTestAccountInstallData(
  appId: number,
  accountId: number
): HubSpotPromise<PublicAppDeveloperTestAccountInstallData> {
  return http.get<PublicAppDeveloperTestAccountInstallData>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/test-portal-installs`,
  });
}

export function fetchPublicAppProductionInstallCounts(
  appId: number,
  accountId: number
): HubSpotPromise<PublicAppInstallCounts> {
  return http.get<PublicAppInstallCounts>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/install-counts-without-test-portals`,
  });
}

export function fetchPublicAppMetadata(
  appId: number,
  accountId: number
): HubSpotPromise<PublicApp> {
  return http.get<PublicApp>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/full`,
  });
}

export function installStaticAuthAppOnTestAccount(
  appId: number,
  accountId: number,
  scopeGroupIds: number[]
) {
  return http.post<void>(accountId, {
    url: APPS_HUBLETS_API_PATH,
    data: {
      appId,
      targetInstallPortalId: accountId,
      scopeGroupIds,
    },
  });
}

export function fetchAppMetadataByUid(
  appUid: string,
  accountId: number
): HubSpotPromise<PublicApp> {
  return http.get<PublicApp>(accountId, {
    url: `${APPS_DEV_API_PATH}/full/portal/sourceId`,
    params: {
      sourceId: appUid,
    },
  });
}
