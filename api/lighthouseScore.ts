import { http } from '../http';
import { Data, QueryParams } from '../types/Http';
import {
  GetLighthouseScoreResponse,
  RequestLighthouseScoreResponse,
} from '../types/Lighthouse';

const LIGHTHOUSE_SCORE_API_BASE = 'quality-engine/v1/lighthouse';

export async function requestLighthouseScore(
  accountId: number,
  data: Data = {}
): Promise<RequestLighthouseScoreResponse> {
  return http.post(accountId, {
    url: `${LIGHTHOUSE_SCORE_API_BASE}/request`,
    data,
  });
}

export async function getLighthouseScoreStatus(
  accountId: number,
  params: QueryParams = {}
): Promise<string> {
  return http.get(accountId, {
    url: `${LIGHTHOUSE_SCORE_API_BASE}/status`,
    params,
  });
}

export async function getLighthouseScore(
  accountId: number,
  params: QueryParams = {}
): Promise<GetLighthouseScoreResponse> {
  return http.get(accountId, {
    url: `${LIGHTHOUSE_SCORE_API_BASE}/scores`,
    params,
  });
}
