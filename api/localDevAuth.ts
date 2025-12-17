import { getAxiosConfig } from '../http/getAxiosConfig.js';
import { http } from '../http/index.js';
import { ENVIRONMENTS } from '../constants/environments.js';
import { Environment } from '../types/Config.js';
import {
  ScopeData,
  AccessTokenResponse,
  EnabledFeaturesResponse,
  ScopeAuthorizationResponse,
} from '../types/Accounts.js';
import { httpClient } from '../http/client.js';
import { PublicAppInstallationData } from '../types/Apps.js';
import { HubSpotPromise } from '../types/Http.js';

const LOCALDEVAUTH_API_AUTH_PATH = 'localdevauth/v1/auth';

export const LOCALDEVAUTH_ACCESS_TOKEN_PATH = `${LOCALDEVAUTH_API_AUTH_PATH}/refresh`;

export function fetchAccessToken(
  personalAccessKey: string,
  env: Environment = ENVIRONMENTS.PROD,
  portalId?: number
): HubSpotPromise<AccessTokenResponse> {
  const axiosConfig = getAxiosConfig({
    env,
    localHostOverride: true,
    url: LOCALDEVAUTH_ACCESS_TOKEN_PATH,
    data: {
      encodedOAuthRefreshToken: personalAccessKey,
    },
    params: portalId ? { portalId } : {},
  });

  return httpClient<AccessTokenResponse>({
    ...axiosConfig,
    method: 'post',
  });
}

export function fetchScopeData(
  accountId: number,
  scopeGroup: string
): HubSpotPromise<ScopeData> {
  return http.get<ScopeData>(accountId, {
    url: `${LOCALDEVAUTH_API_AUTH_PATH}/check-scopes`,
    params: { scopeGroup },
  });
}

export async function fetchScopeAuthorizationData(
  accountId: number
): HubSpotPromise<ScopeAuthorizationResponse> {
  return http.get<ScopeAuthorizationResponse>(accountId, {
    url: `${LOCALDEVAUTH_API_AUTH_PATH}/scope-groups/authorized`,
  });
}

export function fetchAppInstallationData(
  portalId: number,
  projectId: number,
  appUid: string,
  requiredScopeGroups: Array<string>,
  optionalScopeGroups: Array<string> = []
): HubSpotPromise<PublicAppInstallationData> {
  return http.post<PublicAppInstallationData>(portalId, {
    url: `${LOCALDEVAUTH_API_AUTH_PATH}/install-info`,
    data: {
      portalId,
      projectId,
      sourceId: appUid,
      requiredScopeGroups,
      optionalScopeGroups,
    },
  });
}

export async function fetchEnabledFeatures(accountId: number) {
  return http.get<EnabledFeaturesResponse>(accountId, {
    url: `${LOCALDEVAUTH_API_AUTH_PATH}/enabled-features`,
  });
}
