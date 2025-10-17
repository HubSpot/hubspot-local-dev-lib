import { http } from '../http/index.js';
import {
  InitiateSyncResponse,
  FetchTypesResponse,
  TaskRequestData,
} from '../types/Sandbox.js';
import { SANDBOX_TIMEOUT } from '../constants/api.js';
import { HubSpotPromise } from '../types/Http.js';
const SANDBOXES_SYNC_API_PATH = 'sandboxes-sync/v1';

export async function initiateSync(
  fromHubId: number,
  toHubId: number,
  tasks: Array<TaskRequestData>,
  sandboxHubId: number
): HubSpotPromise<InitiateSyncResponse> {
  return http.post<InitiateSyncResponse>(fromHubId, {
    data: {
      command: 'SYNC',
      fromHubId,
      toHubId,
      sandboxHubId,
      tasks,
    },
    timeout: SANDBOX_TIMEOUT,
    url: `${SANDBOXES_SYNC_API_PATH}/tasks/initiate/async`,
  });
}

export async function fetchTypes(
  accountId: number,
  toHubId: number
): HubSpotPromise<FetchTypesResponse> {
  return http.get<FetchTypesResponse>(accountId, {
    url: `${SANDBOXES_SYNC_API_PATH}/types${
      toHubId ? `?toHubId=${toHubId}` : ''
    }`,
  });
}
