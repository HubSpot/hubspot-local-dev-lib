import { http } from '../http/index.js';
import { SANDBOX_TIMEOUT } from '../constants/api.js';
import {
  SandboxPersonalAccessKey,
  SandboxResponse,
  SandboxUsageLimitsResponse,
  V2Sandbox,
} from '../types/Sandbox.js';
import { HubSpotPromise } from '../types/Http.js';

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

export function createV2Sandbox(
  accountId: number,
  name: string,
  type: 'STANDARD' | 'DEVELOPER',
  syncObjectRecords: boolean
): HubSpotPromise<V2Sandbox> {
  return http.post<V2Sandbox>(accountId, {
    url: `${SANDBOX_API_PATH_V2}/sandboxes`,
    data: { name, type, syncObjectRecords },
  });
}

export function getSandboxPersonalAccessKey(
  accountId: number,
  sandboxId: number
): HubSpotPromise<SandboxPersonalAccessKey> {
  return http.post<SandboxPersonalAccessKey>(accountId, {
    url: `${SANDBOX_API_PATH_V2}/sandboxes/${sandboxId}/personal-access-key`,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: SANDBOX_TIMEOUT,
  });
}
