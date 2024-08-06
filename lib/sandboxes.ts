import {
  createSandbox as _createSandbox,
  deleteSandbox as _deleteSandbox,
  getSandboxUsageLimits as _getSandboxUsageLimits,
} from '../api/sandboxHubs';
import {
  initiateSync as _initiateSync,
  fetchTaskStatus as _fetchTaskStatus,
  fetchTypes as _fetchTypes,
} from '../api/sandboxSync';
import {
  InitiateSyncResponse,
  Sandbox,
  SandboxType,
  SyncTaskStatusType,
  TaskRequestData,
  Usage,
} from '../types/Sandbox';

export async function createSandbox(
  accountId: number,
  name: string,
  type: 1 | 2
): Promise<{
  name: string;
  sandbox: Sandbox;
  personalAccessKey: string;
}> {
  const { data } = await _createSandbox(accountId, name, type);
  return {
    name,
    ...data,
  };
}

export async function deleteSandbox(
  parentAccountId: number,
  sandboxAccountId: number
): Promise<{ parentAccountId: number; sandboxAccountId: number }> {
  await _deleteSandbox(parentAccountId, sandboxAccountId);

  return {
    parentAccountId,
    sandboxAccountId,
  };
}

export async function getSandboxUsageLimits(
  parentAccountId: number
): Promise<Usage | void> {
  const { data } = await _getSandboxUsageLimits(parentAccountId);
  return data && data.usage;
}

export async function initiateSync(
  fromHubId: number,
  toHubId: number,
  tasks: Array<TaskRequestData>,
  sandboxHubId: number
): Promise<InitiateSyncResponse> {
  const { data } = await _initiateSync(fromHubId, toHubId, tasks, sandboxHubId);
  return data;
}

export async function fetchTaskStatus(
  accountId: number,
  taskId: number
): Promise<SyncTaskStatusType> {
  const { data } = await _fetchTaskStatus(accountId, taskId);
  return data;
}

export async function fetchTypes(
  accountId: number,
  toHubId: number
): Promise<Array<SandboxType> | void> {
  const { data } = await _fetchTypes(accountId, toHubId);
  return data && data.results;
}
