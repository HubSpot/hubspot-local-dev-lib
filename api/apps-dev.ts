import http from '../http';
import { PublicApp } from '../types/Apps';

const APPS_DEV_API_PATH = 'apps-dev/external/public/v3';

type FetchPublicAppsForPortalResponse = {
  results: Array<PublicApp>;
};

export function fetchPublicAppsForPortal(
  portalId: number
): Promise<FetchPublicAppsForPortalResponse> {
  return http.get<FetchPublicAppsForPortalResponse>(portalId, {
    url: `${APPS_DEV_API_PATH}/full/portal`,
  });
}
