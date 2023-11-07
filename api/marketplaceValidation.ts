import http from '../http';
import { Data, QueryParams } from '../types/Http';
import { GetValidationResultsResponse } from '../types/MarketplaceValidation';

const VALIDATION_API_BASE = 'quality-engine/v1/validation';

export function requestValidation(
  accountId: number,
  data: Data = {}
): Promise<number> {
  return http.post(accountId, {
    url: `${VALIDATION_API_BASE}/request`,
    data,
  });
}

export function getValidationStatus(
  accountId: number,
  query: QueryParams = {}
): Promise<string> {
  return http.get(accountId, {
    url: `${VALIDATION_API_BASE}/status`,
    query,
  });
}

export function getValidationResults(
  accountId: number,
  query: QueryParams = {}
): Promise<GetValidationResultsResponse> {
  return http.get(accountId, {
    url: `${VALIDATION_API_BASE}/results`,
    query,
  });
}
