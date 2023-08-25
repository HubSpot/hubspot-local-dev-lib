import http from '../http';
import { Body, QueryParams } from '../types/Http';
import {
  GetLighthouseScoreResponse,
  RequestLighthouseScoreResponse,
} from '../types/Lighthouse';

const LIGHTHOUSE_SCORE_API_BASE = 'quality-engine/v1/lighthouse';

export async function requestLighthouseScore(
  accountId: number,
  body: Body = {}
): Promise<RequestLighthouseScoreResponse> {
  return http.post(accountId, {
    url: `${LIGHTHOUSE_SCORE_API_BASE}/request`,
    body,
  });
}

export async function getLighthouseScoreStatus(
  accountId: number,
  query: QueryParams = {}
): Promise<string> {
  return http.get(accountId, {
    url: `${LIGHTHOUSE_SCORE_API_BASE}/status`,
    query,
  });
}

export async function getLighthouseScore(
  accountId: number,
  query: QueryParams = {}
): Promise<GetLighthouseScoreResponse> {
  return http.get(accountId, {
    url: `${LIGHTHOUSE_SCORE_API_BASE}/scores`,
    query,
  });
}
