import axios from 'axios';
import { http } from '../http';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { ENVIRONMENTS } from '../constants/environments';
import {
  DeveloperTestAccount,
  CreateDeveloperTestAccountResponse,
  FetchDeveloperTestAccountsResponse,
  DeveloperTestAccountConfig,
  CreateDeveloperTestAccountV3Response,
  InstallAppIntoDeveloperTestAccountResponse,
} from '../types/developerTestAccounts';
import { SANDBOX_TIMEOUT } from '../constants/api';
import { Environment } from '../types/Config';
import { HubSpotPromise } from '../types/Http';

const TEST_ACCOUNTS_API_PATH = 'integrators/test-portals/v2';
const TEST_ACCOUNTS_API_PATH_V3 = 'integrators/test-portals/v3';

export function fetchDeveloperTestAccounts(
  accountId: number
): HubSpotPromise<FetchDeveloperTestAccountsResponse> {
  return http.get<FetchDeveloperTestAccountsResponse>(accountId, {
    url: TEST_ACCOUNTS_API_PATH,
  });
}

export function createDeveloperTestAccount(
  accountId: number,
  accountInfo: string
): HubSpotPromise<CreateDeveloperTestAccountResponse>;
export function createDeveloperTestAccount(
  accountId: number,
  accountInfo: DeveloperTestAccountConfig
): HubSpotPromise<CreateDeveloperTestAccountV3Response>;
export function createDeveloperTestAccount(
  accountId: number,
  accountInfo: string | DeveloperTestAccountConfig
): HubSpotPromise<
  CreateDeveloperTestAccountResponse | CreateDeveloperTestAccountV3Response
> {
  if (typeof accountInfo === 'object') {
    return http.post<CreateDeveloperTestAccountV3Response>(accountId, {
      url: TEST_ACCOUNTS_API_PATH_V3,
      data: accountInfo,
      timeout: SANDBOX_TIMEOUT,
    });
  }
  return http.post<CreateDeveloperTestAccountResponse>(accountId, {
    url: TEST_ACCOUNTS_API_PATH,
    data: { accountName: accountInfo, generatePersonalAccessKey: true }, // For CLI, generatePersonalAccessKey will always be true since we'll be saving the entry to the config
    timeout: SANDBOX_TIMEOUT,
  });
}

export function deleteDeveloperTestAccount(
  accountId: number,
  testAccountId: number,
  useV3 = false
): HubSpotPromise<void> {
  if (useV3) {
    return http.delete(accountId, {
      url: `${TEST_ACCOUNTS_API_PATH_V3}/${testAccountId}`,
    });
  }
  return http.delete(accountId, {
    url: `${TEST_ACCOUNTS_API_PATH}/${testAccountId}`,
  });
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

  return axios<DeveloperTestAccount>(reqWithToken);
}

export function installAppIntoDeveloperTestAccount(
  accountId: number,
  testAccountId: number,
  projectName: string,
  appUId: string
): HubSpotPromise<InstallAppIntoDeveloperTestAccountResponse> {
  return http.post<InstallAppIntoDeveloperTestAccountResponse>(accountId, {
    url: `${TEST_ACCOUNTS_API_PATH_V3}/install-apps`,
    data: {
      testPortalId: testAccountId,
      developerQualifiedSymbols: [{ developerSymbol: appUId, projectName }],
    },
    timeout: SANDBOX_TIMEOUT,
  });
}

export function fetchIsAppIsInstalledIntoDeveloperTestAccount(
  accountId: number,
  projectName: string,
  appUId: string
): HubSpotPromise<{ ready: boolean }> {
  return http.post<{ ready: boolean }>(accountId, {
    url: `${TEST_ACCOUNTS_API_PATH_V3}/install-apps/readiness`,
    data: {
      developerQualifiedSymbols: [{ developerSymbol: appUId, projectName }],
    },
    timeout: SANDBOX_TIMEOUT,
  });
}

export function fetchDeveloperTestAccountGateSyncStatus(
  accountId: number,
  testAccountId: number
): HubSpotPromise<{ status: 'IN_PROGRESS' | 'SUCCESS' }> {
  return http.get<{ status: 'IN_PROGRESS' | 'SUCCESS' }>(accountId, {
    url: `${TEST_ACCOUNTS_API_PATH_V3}/gate-sync-status/${testAccountId}`,
  });
}
