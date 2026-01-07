import { http } from '../http/index.js';
import { HubSpotPromise, QueryParams } from '../types/Http.js';
import {
  FetchThemesResponse,
  FetchBuiltinMappingResponse,
} from '../types/DesignManager.js';

const DESIGN_MANAGER_API_PATH = 'designmanager/v1';

export function fetchThemes(
  accountId: number,
  params: QueryParams = {}
): HubSpotPromise<FetchThemesResponse> {
  return http.get<FetchThemesResponse>(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/themes/combined`,
    params,
  });
}

export function fetchBuiltinMapping(
  accountId: number
): HubSpotPromise<FetchBuiltinMappingResponse> {
  return http.get<FetchBuiltinMappingResponse>(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/widgets/builtin-mapping`,
  });
}
