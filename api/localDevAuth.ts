import request from 'request-promise-native';
import { getAxiosConfig } from '../http/getAxiosConfig';
import http from '../http';
import { ENVIRONMENTS } from '../constants/environments';
import { Environment } from '../types/Config';

const LOCALDEVAUTH_API_AUTH_PATH = 'localdevauth/v1/auth';

type AccessTokenResponse = {
  hubId: number;
  oauthAccessToken: string;
  expiresAtMillis: number;
  scopeGroups: Array<string>;
  encodedOauthRefreshToken: string;
};

export async function fetchAccessToken(
  personalAccessKey: string,
  env: Environment = ENVIRONMENTS.PROD,
  portalId?: number
): Promise<AccessTokenResponse> {
  const query = portalId ? { portalId } : {};
  const axiosConfig = getAxiosConfig({
    env,
    localHostOverride: true,

    uri: `${LOCALDEVAUTH_API_AUTH_PATH}/refresh`,
    body: {
      encodedOAuthRefreshToken: personalAccessKey,
    },
    params: query,
  });

  return request.post(axiosConfig);
}

export async function fetchScopeData(accountId: number, scopeGroup: string) {
  return http.get(accountId, {
    uri: `localdevauth/v1/auth/check-scopes`,
    query: {
      scopeGroup,
    },
  });
}
