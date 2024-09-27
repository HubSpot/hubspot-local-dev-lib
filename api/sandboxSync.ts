import { AxiosPromise } from 'axios';
import { http } from '../http';
import {
  InitiateSyncResponse,
  FetchTypesResponse,
  TaskRequestData,
} from '../types/Sandbox';
import { SANDBOX_TIMEOUT } from '../constants/api';
const SANDBOXES_SYNC_API_PATH = 'sandboxes-sync/v1';

export function initiateSync(
  fromHubId: number,
  toHubId: number,
  tasks: Array<TaskRequestData>,
  sandboxHubId: number
): AxiosPromise<InitiateSyncResponse> {
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
): AxiosPromise<FetchTypesResponse> {
  return http.get<FetchTypesResponse>(accountId, {
    url: `${SANDBOXES_SYNC_API_PATH}/types${
      toHubId ? `?toHubId=${toHubId}` : ''
    }`,
  });
}
