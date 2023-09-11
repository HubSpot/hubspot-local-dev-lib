import http from '../http';
import {
  InitiateSyncResponse,
  Task,
  SyncTask,
  FetchTypesResponse,
} from '../types/Sandbox';
const SANDBOXES_SYNC_API_PATH = 'sandboxes-sync/v1';

export async function initiateSync(
  fromHubId: number,
  toHubId: number,
  tasks: Array<SyncTask>,
  sandboxHubId: number
): Promise<InitiateSyncResponse> {
  return http.post(fromHubId, {
    body: {
      command: 'SYNC',
      fromHubId,
      toHubId,
      sandboxHubId,
      tasks,
    },
    timeout: 60000,
    url: `${SANDBOXES_SYNC_API_PATH}/tasks/initiate/async`,
  });
}

export async function fetchTaskStatus(
  accountId: number,
  taskId: number
): Promise<Task> {
  return http.get(accountId, {
    url: `${SANDBOXES_SYNC_API_PATH}/tasks/${taskId}`,
  });
}

export async function fetchTypes(
  accountId: number,
  toHubId: number
): Promise<FetchTypesResponse> {
  return http.get(accountId, {
    url: `${SANDBOXES_SYNC_API_PATH}/types${
      toHubId ? `?toHubId=${toHubId}` : ''
    }`,
  });
}
