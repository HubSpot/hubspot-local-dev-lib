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
import { throwError } from '../errors/standardErrors';

export async function createSandbox(
  accountId: number,
  name: string,
  type: 1 | 2
): Promise<{
  name: string;
  sandbox: Sandbox;
  personalAccessKey: string;
}> {
  try {
    const resp = await _createSandbox(accountId, name, type);
    return {
      name,
      ...resp,
    };
  } catch (err) {
    throwError(err);
  }
}

export async function deleteSandbox(
  parentAccountId: number,
  sandboxAccountId: number
): Promise<{ parentAccountId: number; sandboxAccountId: number }> {
  try {
    await _deleteSandbox(parentAccountId, sandboxAccountId);
  } catch (err) {
    throwError(err);
  }

  return {
    parentAccountId,
    sandboxAccountId,
  };
}

export async function getSandboxUsageLimits(
  parentAccountId: number
): Promise<Usage | void> {
  try {
    const resp = await _getSandboxUsageLimits(parentAccountId);
    return resp && resp.usage;
  } catch (err) {
    throwError(err);
  }
}

export async function initiateSync(
  fromHubId: number,
  toHubId: number,
  tasks: Array<TaskRequestData>,
  sandboxHubId: number
): Promise<InitiateSyncResponse> {
  try {
    return await _initiateSync(fromHubId, toHubId, tasks, sandboxHubId);
  } catch (err) {
    throwError(err);
  }
}

export async function fetchTaskStatus(
  accountId: number,
  taskId: number
): Promise<SyncTaskStatusType> {
  try {
    return await _fetchTaskStatus(accountId, taskId);
  } catch (err) {
    throwError(err);
  }
}

export async function fetchTypes(
  accountId: number,
  toHubId: number
): Promise<Array<SandboxType> | void> {
  try {
    const resp = await _fetchTypes(accountId, toHubId);
    return resp && resp.results;
  } catch (err) {
    throwError(err);
  }
}
