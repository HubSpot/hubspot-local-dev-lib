import http from '../http';
import { FetchAppsResponse } from '../types/App';

const APPS_API_PATH = 'apps-dev/external/public/v3';

export async function fetchPublicApps(
  accountId: number
): Promise<FetchAppsResponse> {
  return http.get(accountId, {
    url: `${APPS_API_PATH}/full/portal`,
  });
}
