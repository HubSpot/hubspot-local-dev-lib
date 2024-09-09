import { AxiosPromise } from 'axios';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { http } from '../http';
import { ENVIRONMENTS } from '../constants/environments';
import { Environment } from '../types/Config';
import {
  ScopeData,
  AccessTokenResponse,
  EnabledFeaturesResponse,
} from '../types/Accounts';
import axios from 'axios';
import { PublicAppInstallationData } from '../types/Apps';

const LOCALDEVAUTH_API_AUTH_PATH = 'localdevauth/v1/auth';

export function fetchAccessToken(
  personalAccessKey: string,
  env: Environment = ENVIRONMENTS.PROD,
  portalId?: number
): AxiosPromise<AccessTokenResponse> {
  const axiosConfig = getAxiosConfig({
    env,
    localHostOverride: true,
    url: `${LOCALDEVAUTH_API_AUTH_PATH}/refresh`,
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
): AxiosPromise<ScopeData> {
  return http.get<ScopeData>(accountId, {
    url: `${LOCALDEVAUTH_API_AUTH_PATH}/check-scopes`,
    params: { scopeGroup },
  });
}

export function fetchAppInstallationData(
  portalId: number,
  projectId: number,
  appUid: string,
  requiredScopeGroups: Array<string>,
  optionalScopeGroups: Array<string> = []
): AxiosPromise<PublicAppInstallationData> {
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
