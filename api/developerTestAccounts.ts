import axios from 'axios';
import { http } from '../http/index.js';
import { getAxiosConfig } from '../http/getAxiosConfig.js';
import { ENVIRONMENTS } from '../constants/environments.js';
import {
  DeveloperTestAccount,
  CreateDeveloperTestAccountResponse,
  FetchDeveloperTestAccountsResponse,
  DeveloperTestAccountConfig,
  CreateDeveloperTestAccountV3Response,
  InstallOauthAppIntoDeveloperTestAccountResponse,
  TestPortalStatusResponse,
  GenerateDeveloperTestAccountPersonalAccessKeyResponse,
} from '../types/developerTestAccounts.js';
import { SANDBOX_TIMEOUT } from '../constants/api.js';
import { Environment } from '../types/Config.js';
import { HubSpotPromise } from '../types/Http.js';

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

export function installOauthAppIntoDeveloperTestAccount(
  accountId: number,
  testAccountId: number,
  projectName: string,
  appUId: string
): HubSpotPromise<InstallOauthAppIntoDeveloperTestAccountResponse> {
  return http.post<InstallOauthAppIntoDeveloperTestAccountResponse>(accountId, {
    url: `${TEST_ACCOUNTS_API_PATH_V3}/install-apps`,
    data: {
      testPortalId: testAccountId,
      developerQualifiedSymbol: { developerSymbol: appUId, projectName },
    },
    timeout: SANDBOX_TIMEOUT,
  });
}

export function fetchDeveloperTestAccountOauthAppInstallStatus(
  accountId: number,
  projectName: string,
  appUId: string
): HubSpotPromise<TestPortalStatusResponse> {
  return http.post<TestPortalStatusResponse>(accountId, {
    url: `${TEST_ACCOUNTS_API_PATH_V3}/install-apps/readiness`,
    data: {
      developerQualifiedSymbol: { developerSymbol: appUId, projectName },
    },
    timeout: SANDBOX_TIMEOUT,
  });
}

export function fetchDeveloperTestAccountGateSyncStatus(
  accountId: number,
  testAccountId: number
): HubSpotPromise<TestPortalStatusResponse> {
  return http.get<TestPortalStatusResponse>(accountId, {
    url: `${TEST_ACCOUNTS_API_PATH_V3}/gate-sync-status/${testAccountId}`,
  });
}

export function generateDeveloperTestAccountPersonalAccessKey(
  accountId: number,
  testAccountId: number
): HubSpotPromise<GenerateDeveloperTestAccountPersonalAccessKeyResponse> {
  return http.get<GenerateDeveloperTestAccountPersonalAccessKeyResponse>(
    accountId,
    {
      url: `${TEST_ACCOUNTS_API_PATH_V3}/generate-pak/${testAccountId}`,
    }
  );
}
