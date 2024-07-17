import http from '../http';
import {
  PublicApp,
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

export function fetchPublicAppMetadata(
  appId: number,
  accountId: number
): Promise<PublicApp> {
  return http.get<PublicApp>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/full`,
  });
}
