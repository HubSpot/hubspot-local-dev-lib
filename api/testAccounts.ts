import axios from 'axios';
import http from '../http';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { ENVIRONMENTS } from '../constants/environments';
import {
  DeveloperTestAccount,
  FetchTestAccountsResponse,
} from '../types/testAccounts';
import { SANDBOX_TIMEOUT } from '../constants/api';
import { Environment } from '../types/Config';

const TEST_ACCOUNTS_API_PATH = 'integrators/test-portals/v2';

export async function fetchTestAccounts(
  accountId: number
): Promise<FetchTestAccountsResponse> {
  return http.get(accountId, {
    url: TEST_ACCOUNTS_API_PATH,
  });
}

export async function createTestAccount(
  accountId: number,
  accountName: string
): Promise<DeveloperTestAccount> {
  return http.post(accountId, {
    url: TEST_ACCOUNTS_API_PATH,
    data: { accountName, generatePersonalAccessKey: true }, // For CLI, generatePersonalAccessKey will always be true since we'll be saving the entry to the config
    timeout: SANDBOX_TIMEOUT,
  });
}

export async function deleteTestAccount(
  accountId: number,
  testAccountId: number
): Promise<void> {
  return http.delete(accountId, {
    url: `${TEST_ACCOUNTS_API_PATH}/${testAccountId}`,
  });
}

export async function fetchTestAccountData(
  accessToken: string,
  portalId: number,
  env: Environment = ENVIRONMENTS.PROD
): Promise<DeveloperTestAccount> {
  const axiosConfig = getAxiosConfig({
    env,
    url: `${TEST_ACCOUNTS_API_PATH}/self`,
    params: { portalId },
  });
  const reqWithToken = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const { data } = await axios<DeveloperTestAccount>(reqWithToken);

  return data;
}
