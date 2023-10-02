import http from '../http';
import { QueryParams } from '../types/Http';

const RESULTS_API_PATH = 'cms/v3/functions/results';

//TODO: These endpoints are temporarily disabled, while the Apps team refactors them. Going to hold off adding return types until then.

export async function getFunctionLogs(
  accountId: number,
  route: string,
  query: QueryParams = {}
) {
  const { limit = 5 } = query;

  return http.get(accountId, {
    url: `${RESULTS_API_PATH}/by-route/${encodeURIComponent(route)}`,
    query: { ...query, limit },
  });
}

export async function getLatestFunctionLog(accountId: number, route: string) {
  return http.get(accountId, {
    url: `${RESULTS_API_PATH}/by-route/${encodeURIComponent(route)}/latest`,
  });
}
