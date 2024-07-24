import http from '../http';
import {
  PublicApp,
  PublicApInstallCounts,
  PublicAppDeveloperTestAccountInstallData,
} from '../types/Apps';

const APPS_DEV_API_PATH = 'apps-dev/external/public/v3';

type FetchPublicAppsForPortalResponse = {
  results: Array<PublicApp>;
};

export async function fetchPublicAppsForPortal(
  accountId: number
): Promise<Array<PublicApp>> {
  const resp = await http.get<FetchPublicAppsForPortalResponse>(accountId, {
    url: `${APPS_DEV_API_PATH}/full/portal`,
  });

  return resp ? resp.results : [];
}

export function fetchPublicAppDeveloperTestAccountInstallData(
  appId: number,
  accountId: number
): Promise<PublicAppDeveloperTestAccountInstallData> {
  return http.get<PublicAppDeveloperTestAccountInstallData>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/test-portal-installs`,
  });
}

export function fetchPublicAppProductionInstallCounts(
  appId: number,
  accountId: number
): Promise<PublicApInstallCounts> {
  return http.get<PublicApInstallCounts>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/install-counts-without-test-portals`,
  });
}

export function fetchPublicAppMetadata(
  appId: number,
  accountId: number
): Promise<PublicApp> {
  return http.get<PublicApp>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/full`,
  });
}
