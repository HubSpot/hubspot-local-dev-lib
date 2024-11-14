import { http, HubSpotResponse } from '../http';
import { QueryParams } from '../types/Http';
import {
  FetchThemesResponse,
  FetchBuiltinMappingResponse,
} from '../types/DesignManager';

const DESIGN_MANAGER_API_PATH = 'designmanager/v1';

export function fetchThemes(
  accountId: number,
  params: QueryParams = {}
): HubSpotResponse<FetchThemesResponse> {
  return http.get<FetchThemesResponse>(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/themes/combined`,
    params,
  });
}

export function fetchBuiltinMapping(
  accountId: number
): HubSpotResponse<FetchBuiltinMappingResponse> {
  return http.get<FetchBuiltinMappingResponse>(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/widgets/builtin-mapping`,
  });
}
