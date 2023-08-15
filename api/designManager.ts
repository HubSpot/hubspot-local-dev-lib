import http from '../http';

const DESIGN_MANAGER_API_PATH = 'designmanager/v1';

type FetchThemesResponse = {
  objects: Array<{
    theme: {
      path: string;
    };
  }>;
};

export async function fetchThemes(
  accountId: number,
  query = {}
): Promise<FetchThemesResponse> {
  return http.get<FetchThemesResponse>(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/themes/combined`,
    query,
  });
}

type FetchBuiltinMappingResponse = {
  [key: string]: string;
};

export async function fetchBuiltinMapping(
  accountId: number
): Promise<FetchBuiltinMappingResponse> {
  return http.get<FetchBuiltinMappingResponse>(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/widgets/builtin-mapping`,
  });
}
