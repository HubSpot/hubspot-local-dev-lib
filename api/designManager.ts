import { AxiosPromise } from 'axios';
import { http } from '../http';
import { QueryParams } from '../types/Http';

const DESIGN_MANAGER_API_PATH = 'designmanager/v1';

type FetchThemesResponse = {
  objects: Array<{
    theme: {
      path: string;
    };
  }>;
};

export function fetchThemes(
  accountId: number,
  params: QueryParams = {}
): AxiosPromise<FetchThemesResponse> {
  return http.get<FetchThemesResponse>(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/themes/combined`,
    params,
  });
}

type FetchBuiltinMappingResponse = {
  [key: string]: string;
};

export function fetchBuiltinMapping(
  accountId: number
): AxiosPromise<FetchBuiltinMappingResponse> {
  return http.get<FetchBuiltinMappingResponse>(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/widgets/builtin-mapping`,
  });
}
