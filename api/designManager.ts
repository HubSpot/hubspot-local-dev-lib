import http from '../http';

const DESIGN_MANAGER_API_PATH = 'designmanager/v1';

export async function fetchThemes(accountId: number, query = {}) {
  return http.get(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/themes/combined`,
    query,
  });
}

export async function fetchBuiltinMapping(accountId: number) {
  return http.get(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/widgets/builtin-mapping`,
  });
}

export async function fetchRawAssetByPath(accountId: number, path: string) {
  return http.get(accountId, {
    url: `${DESIGN_MANAGER_API_PATH}/raw-assets/by-path/${path}?portalId=${accountId}`,
  });
}
