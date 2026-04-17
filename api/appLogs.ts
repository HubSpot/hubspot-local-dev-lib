import { http } from '../http/index.js';
import { HubSpotPromise } from '../types/Http.js';
import {
  SearchLogsRequest,
  SearchLogsResponse,
  SystemType,
} from '../types/AppLogs.js';

const APP_LOGS_API_PATH = 'developer/platform/logging/search/v1/logs';

export function searchAppLogs(
  accountId: number,
  appId: number,
  systemType: SystemType,
  requestBody: SearchLogsRequest = {}
): HubSpotPromise<SearchLogsResponse> {
  return http.post<SearchLogsResponse>(accountId, {
    url: `${APP_LOGS_API_PATH}/${appId}/${systemType}/search`,
    data: requestBody,
  });
}
