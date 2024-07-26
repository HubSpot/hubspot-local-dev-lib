import { AxiosPromise } from 'axios';
import http from '../http';
import { Data, QueryParams } from '../types/Http';
import { GetValidationResultsResponse } from '../types/MarketplaceValidation';

const VALIDATION_API_BASE = 'quality-engine/v1/validation';

export function requestValidation(
  accountId: number,
  data: Data = {}
): AxiosPromise<number> {
  return http.post<number>(accountId, {
    url: `${VALIDATION_API_BASE}/request`,
    data,
  });
}

export function getValidationStatus(
  accountId: number,
  params: QueryParams = {}
): AxiosPromise<string> {
  return http.get<string>(accountId, {
    url: `${VALIDATION_API_BASE}/status`,
    params,
  });
}

export function getValidationResults(
  accountId: number,
  params: QueryParams = {}
): AxiosPromise<GetValidationResultsResponse> {
  return http.get<GetValidationResultsResponse>(accountId, {
    url: `${VALIDATION_API_BASE}/results`,
    params,
  });
}
