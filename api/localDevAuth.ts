import { http } from '../http/index.js';
import { LOCALDEVAUTH_API_AUTH_PATH } from '../constants/endpoints.js';
import {
  ScopeData,
  EnabledFeaturesResponse,
  ScopeAuthorizationResponse,
} from '../types/Accounts.js';
import { PublicAppInstallationData } from '../types/Apps.js';
import { HubSpotPromise } from '../types/Http.js';

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
