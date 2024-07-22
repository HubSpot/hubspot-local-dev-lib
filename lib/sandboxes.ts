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
  const resp = await _createSandbox(accountId, name, type);
  return {
    name,
    ...resp,
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
  const resp = await _getSandboxUsageLimits(parentAccountId);
  return resp && resp.usage;
}

export async function initiateSync(
  fromHubId: number,
  toHubId: number,
  tasks: Array<TaskRequestData>,
  sandboxHubId: number
): Promise<InitiateSyncResponse> {
  return _initiateSync(fromHubId, toHubId, tasks, sandboxHubId);
}

export async function fetchTaskStatus(
  accountId: number,
  taskId: number
): Promise<SyncTaskStatusType> {
  return _fetchTaskStatus(accountId, taskId);
}

export async function fetchTypes(
  accountId: number,
  toHubId: number
): Promise<Array<SandboxType> | void> {
  const resp = await _fetchTypes(accountId, toHubId);
  return resp && resp.results;
}
