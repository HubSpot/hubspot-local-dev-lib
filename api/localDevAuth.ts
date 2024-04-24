import { getAxiosConfig } from '../http/getAxiosConfig';
import http from '../http';
import { ENVIRONMENTS } from '../constants/environments';
import { Environment } from '../types/Config';
import { ScopeData } from '../types/Accounts';
import axios from 'axios';
import { HUBSPOT_ACCOUNT_TYPES } from '../constants/config';
import { ValueOf } from '../types/Utils';

const LOCALDEVAUTH_API_AUTH_PATH = 'localdevauth/v1/auth';

type AccessTokenResponse = {
  hubId: number;
  userId: number;
  oauthAccessToken: string;
  expiresAtMillis: number;
  enabledFeatures?: { [key: string]: number };
  scopeGroups: Array<string>;
  encodedOAuthRefreshToken: string;
  hubName: string;
  accountType: ValueOf<typeof HUBSPOT_ACCOUNT_TYPES>;
};

export async function fetchAccessToken(
  personalAccessKey: string,
  env: Environment = ENVIRONMENTS.PROD,
  portalId?: number
): Promise<AccessTokenResponse> {
  const axiosConfig = getAxiosConfig({
    env,
    localHostOverride: true,
    url: `${LOCALDEVAUTH_API_AUTH_PATH}/refresh`,
    data: {
      encodedOAuthRefreshToken: personalAccessKey,
    },
    params: portalId ? { portalId } : {},
  });

  const { data } = await axios<AccessTokenResponse>({
    ...axiosConfig,
    method: 'post',
  });

  return data;
}

export async function fetchScopeData(
  accountId: number,
  scopeGroup: string
): Promise<ScopeData> {
  return http.get<ScopeData>(accountId, {
    url: `localdevauth/v1/auth/check-scopes`,
    params: { scopeGroup },
  });
}

export async function fetchAppInstallationData(
  portalId: number,
  projectId: number,
  appUid: string,
  requiredScopeGroups: Array<string>,
  optionalScopeGroups: Array<string> = []
) {
  return http.post(portalId, {
    url: 'localdevauth/v1/auth/install-info',
    data: {
      portalId,
      projectId,
      sourceId: appUid,
      requiredScopeGroups,
      optionalScopeGroups,
    },
  });
}
