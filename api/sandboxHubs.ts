import axios from 'axios';
import http from '../http';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { ENVIRONMENTS } from '../constants/environments';
import { Environment } from '../types/Config';
import {
  SandboxHubData,
  SandboxResponse,
  SandboxUsageLimitsResponse,
} from '../types/Sandbox';

const SANDBOX_API_PATH = 'sandbox-hubs/v1';
const SANDBOX_API_PATH_V2 = 'sandbox-hubs/v2';

export async function createSandbox(
  accountId: number,
  name: string,
  type: string
): Promise<SandboxResponse> {
  return http.post(accountId, {
    body: { name, type, generatePersonalAccessKey: true }, // For CLI, generatePersonalAccessKey will always be true since we'll be saving the entry to the config
    timeout: 60000,
    url: SANDBOX_API_PATH_V2, // Create uses v2 for sandbox type and PAK generation support
  });
}

export async function deleteSandbox(
  parentAccountId: number,
  sandboxAccountId: number
): Promise<void> {
  return http.delete(parentAccountId, {
    url: `${SANDBOX_API_PATH}/${sandboxAccountId}`,
  });
}

export async function getSandboxUsageLimits(
  parentAccountId: number
): Promise<SandboxUsageLimitsResponse> {
  return http.get(parentAccountId, {
    url: `${SANDBOX_API_PATH}/parent/${parentAccountId}/usage`,
  });
}

export async function fetchSandboxHubData(
  accessToken: string,
  portalId: number,
  env: Environment = ENVIRONMENTS.PROD
): Promise<SandboxHubData> {
  const axiosConfig = getAxiosConfig({
    env,
    url: `${SANDBOX_API_PATH}/self`,
    params: { portalId },
  });
  const reqWithToken = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const { data } = await axios<SandboxHubData>(reqWithToken);

  return data;
}
