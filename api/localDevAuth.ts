import { getAxiosConfig } from '../http/getAxiosConfig';
import { http } from '../http';
import { ENVIRONMENTS } from '../constants/environments';
import { Environment } from '../types/Config';
import {
  ScopeData,
  AccessTokenResponse,
  EnabledFeaturesResponse,
  ScopeAuthorizationResponse,
} from '../types/Accounts';
import axios from 'axios';
import { PublicAppInstallationData } from '../types/Apps';
import { HubSpotPromise } from '../types/Http';

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

  return axios<AccessTokenResponse>({
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
