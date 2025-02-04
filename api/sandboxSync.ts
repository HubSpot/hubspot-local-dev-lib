import { http } from '../http';
import {
  InitiateSyncResponse,
  FetchTypesResponse,
  TaskRequestData,
} from '../types/Sandbox';
import { SANDBOX_TIMEOUT } from '../constants/api';
import { HubSpotPromise } from '../types/Http';

const SANDBOXES_SYNC_API_PATH = 'sandboxes-sync/v1';
const PORTABILITY_SYNC_API_PATH = 'portability-sync/v1';

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
    url: `${PORTABILITY_SYNC_API_PATH}/types${
      toHubId ? `?toHubId=${toHubId}` : ''
    }`,
  });
}
