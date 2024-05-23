import http from '../http';
import {
  PublicApp,
  PublicAppDeveloperTestAccountInstallData,
  PublicAppInstallationAccount,
} from '../types/Apps';

const APPS_DEV_API_PATH = 'apps-dev/external/public/v3';

type FetchPublicAppsForPortalResponse = {
  results: Array<PublicApp>;
};

type FetchPublicAppInstallationAccountsResponse = {
  results: Array<PublicAppInstallationAccount>;
};

export async function fetchPublicAppsForPortal(
  accountId: number
): Promise<Array<PublicApp>> {
  const resp = await http.get<FetchPublicAppsForPortalResponse>(accountId, {
    url: `${APPS_DEV_API_PATH}/full/portal`,
  });

  return resp ? resp.results : [];
}

export async function fetchPublicAppInstallationAccounts(
  appId: number,
  accountId: number
): Promise<Array<PublicAppInstallationAccount>> {
  const resp = await http.get<FetchPublicAppInstallationAccountsResponse>(
    accountId,
    {
      url: `appinstalls/v3/app-install/internal/portals-with-active-installs/${appId}/`,
    }
  );

  return resp ? resp.results : [];
}

export function fetchPublicAppDeveloperTestAccountInstalls(
  appId: number,
  accountId: number
): Promise<PublicAppDeveloperTestAccountInstallData> {
  return http.get<PublicAppDeveloperTestAccountInstallData>(accountId, {
    url: `${APPS_DEV_API_PATH}/${appId}/test-portal-installs`,
  });
}
