import { http } from '../http';
import { Data, HubSpotPromise, QueryParams } from '../types/Http';
import {
  GetLighthouseScoreResponse,
  RequestLighthouseScoreResponse,
} from '../types/Lighthouse';

const LIGHTHOUSE_SCORE_API_BASE = 'quality-engine/v1/lighthouse';

export function requestLighthouseScore(
  accountId: number,
  data: Data = {}
): HubSpotPromise<RequestLighthouseScoreResponse> {
  return http.post<RequestLighthouseScoreResponse>(accountId, {
    url: `${LIGHTHOUSE_SCORE_API_BASE}/request`,
    data,
  });
}

export function getLighthouseScoreStatus(
  accountId: number,
  params: QueryParams = {}
): HubSpotPromise<string> {
  return http.get<string>(accountId, {
    url: `${LIGHTHOUSE_SCORE_API_BASE}/status`,
    params,
  });
}

export function getLighthouseScore(
  accountId: number,
  params: QueryParams = {}
): HubSpotPromise<GetLighthouseScoreResponse> {
  return http.get<GetLighthouseScoreResponse>(accountId, {
    url: `${LIGHTHOUSE_SCORE_API_BASE}/scores`,
    params,
  });
}
