import axios, { AxiosPromise } from 'axios';
import http from '../http';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { ENVIRONMENTS } from '../constants/environments';
import {
  DeveloperTestAccount,
  FetchDeveloperTestAccountsResponse,
} from '../types/developerTestAccounts';
import { SANDBOX_TIMEOUT } from '../constants/api';
import { Environment } from '../types/Config';

const TEST_ACCOUNTS_API_PATH = 'integrators/test-portals/v2';

export async function fetchDeveloperTestAccounts(
  accountId: number
): AxiosPromise<FetchDeveloperTestAccountsResponse> {
  return http.get<FetchDeveloperTestAccountsResponse>(accountId, {
    url: TEST_ACCOUNTS_API_PATH,
  });
}

export async function createDeveloperTestAccount(
  accountId: number,
  accountName: string
): AxiosPromise<DeveloperTestAccount> {
  return http.post<DeveloperTestAccount>(accountId, {
    url: TEST_ACCOUNTS_API_PATH,
    data: { accountName, generatePersonalAccessKey: true }, // For CLI, generatePersonalAccessKey will always be true since we'll be saving the entry to the config
    timeout: SANDBOX_TIMEOUT,
  });
}

export async function deleteDeveloperTestAccount(
  accountId: number,
  testAccountId: number
): AxiosPromise<void> {
  return http.delete(accountId, {
    url: `${TEST_ACCOUNTS_API_PATH}/${testAccountId}`,
  });
}

export async function fetchDeveloperTestAccountData(
  accessToken: string,
  accountId: number,
  env: Environment = ENVIRONMENTS.PROD
): AxiosPromise<DeveloperTestAccount> {
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
