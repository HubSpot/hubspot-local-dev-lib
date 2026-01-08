import { AxiosPromise } from 'axios';
import { httpClient } from '../http/client.js';
import { getAxiosConfig } from '../http/getAxiosConfig.js';
import { ENVIRONMENTS } from '../constants/environments.js';
import { LOCALDEVAUTH_ACCESS_TOKEN_PATH } from '../constants/endpoints.js';
import { AccessTokenResponse, Environment } from '../types/Accounts.js';
import { DeveloperTestAccount } from '../types/developerTestAccounts.js';
import { SandboxHubData } from '../types/Sandbox.js';
import { HubSpotPromise } from '../types/Http.js';

const SANDBOX_API_PATH = 'sandbox-hubs/v1';
const TEST_ACCOUNTS_API_PATH = 'integrators/test-portals/v2';

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

export function fetchSandboxHubData(
  accessToken: string,
  accountId: number,
  env: Environment = ENVIRONMENTS.PROD
): AxiosPromise<SandboxHubData> {
  const axiosConfig = getAxiosConfig({
    env,
    url: `${SANDBOX_API_PATH}/self`,
    params: { portalId: accountId },
  });
  const reqWithToken = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return httpClient<SandboxHubData>(reqWithToken);
}

export function fetchDeveloperTestAccountData(
  accessToken: string,
  accountId: number,
  env: Environment = ENVIRONMENTS.PROD
): HubSpotPromise<DeveloperTestAccount> {
  const axiosConfig = getAxiosConfig({
    env,
    url: `${TEST_ACCOUNTS_API_PATH}/self`,
    params: { portalId: accountId },
  });
  const reqWithToken = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  return httpClient<DeveloperTestAccount>(reqWithToken);
}

