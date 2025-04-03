import axios, { AxiosPromise } from 'axios';
import { http } from '../http';
import { getAxiosConfig } from '../http/getAxiosConfig';
import { ENVIRONMENTS } from '../constants/environments';
import { SANDBOX_TIMEOUT } from '../constants/api';
import { Environment } from '../types/Config';
import {
  PersonalAccessKey,
  SandboxHubData,
  SandboxResponse,
  SandboxUsageLimitsResponse,
  V2Sandbox,
} from '../types/Sandbox';
import { HubSpotPromise } from '../types/Http';

const SANDBOX_API_PATH = 'sandbox-hubs/v1';
const SANDBOX_API_PATH_V2 = 'sandbox-hubs/v2';

export function createSandbox(
  accountId: number,
  name: string,
  type: 1 | 2
): HubSpotPromise<SandboxResponse> {
  return http.post<SandboxResponse>(accountId, {
    data: { name, type, generatePersonalAccessKey: true }, // For CLI, generatePersonalAccessKey will always be true since we'll be saving the entry to the config
    timeout: SANDBOX_TIMEOUT,
    url: SANDBOX_API_PATH_V2, // Create uses v2 for sandbox type and PAK generation support
  });
}

export function deleteSandbox(
  parentAccountId: number,
  sandboxAccountId: number
): HubSpotPromise<void> {
  return http.delete(parentAccountId, {
    url: `${SANDBOX_API_PATH}/${sandboxAccountId}`,
  });
}

export function getSandboxUsageLimits(
  parentAccountId: number
): HubSpotPromise<SandboxUsageLimitsResponse> {
  return http.get<SandboxUsageLimitsResponse>(parentAccountId, {
    url: `${SANDBOX_API_PATH}/parent/${parentAccountId}/usage`,
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

  return axios<SandboxHubData>(reqWithToken);
}

export function createV2Sandbox(
  accountId: number,
  name: string,
  type: 'STANDARD' | 'DEVELOPMENT',
  syncObjectRecords: boolean
): HubSpotPromise<V2Sandbox> {
  return http.post<V2Sandbox>(accountId, {
    url: `${SANDBOX_API_PATH_V2}/sandboxes`,
    data: { name, type, syncObjectRecords },
  });
}

export function getPersonalAccessKey(
  accountId: number,
  sandboxId: number
): HubSpotPromise<PersonalAccessKey> {
  return http.post<PersonalAccessKey>(accountId, {
    url: `${SANDBOX_API_PATH_V2}/sandboxes/${sandboxId}/personal-access-key`,
  });
}
