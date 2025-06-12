import axios from 'axios';
import { http } from '../http';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { ENVIRONMENTS } from '../constants/environments';
import {
  DeveloperTestAccount,
  CreateDeveloperTestAccountResponse,
  FetchDeveloperTestAccountsResponse,
} from '../types/developerTestAccounts';
import { SANDBOX_TIMEOUT } from '../constants/api';
import { Environment } from '../types/Config';
import { HubSpotPromise } from '../types/Http';

const TEST_ACCOUNTS_API_PATH = 'integrators/test-portals/v2';

export function fetchDeveloperTestAccounts(
  accountId: number
): HubSpotPromise<FetchDeveloperTestAccountsResponse> {
  return http.get<FetchDeveloperTestAccountsResponse>(accountId, {
    url: TEST_ACCOUNTS_API_PATH,
  });
}

export function createDeveloperTestAccount(
  accountId: number,
  accountName: string
): HubSpotPromise<CreateDeveloperTestAccountResponse> {
  return http.post<CreateDeveloperTestAccountResponse>(accountId, {
    url: TEST_ACCOUNTS_API_PATH,
    data: { accountName, generatePersonalAccessKey: true }, // For CLI, generatePersonalAccessKey will always be true since we'll be saving the entry to the config
    timeout: SANDBOX_TIMEOUT,
  });
}

export function deleteDeveloperTestAccount(
  accountId: number,
  testAccountId: number
): HubSpotPromise<void> {
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
