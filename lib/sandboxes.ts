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
import { throwApiError } from '../errors/apiErrors';

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
    const { data } = await _createSandbox(accountId, name, type);
    return {
      name,
      ...data,
    };
  } catch (err) {
    throwApiError(err);
  }
}

export async function deleteSandbox(
  parentAccountId: number,
  sandboxAccountId: number
): Promise<{ parentAccountId: number; sandboxAccountId: number }> {
  try {
    await _deleteSandbox(parentAccountId, sandboxAccountId);
  } catch (err) {
    throwApiError(err);
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
    const { data } = await _getSandboxUsageLimits(parentAccountId);
    return data && data.usage;
  } catch (err) {
    throwApiError(err);
  }
}

export async function initiateSync(
  fromHubId: number,
  toHubId: number,
  tasks: Array<TaskRequestData>,
  sandboxHubId: number
): Promise<InitiateSyncResponse> {
  try {
    const { data } = await _initiateSync(
      fromHubId,
      toHubId,
      tasks,
      sandboxHubId
    );
    return data;
  } catch (err) {
    throwApiError(err);
  }
}

export async function fetchTaskStatus(
  accountId: number,
  taskId: number
): Promise<SyncTaskStatusType> {
  try {
    const { data } = await _fetchTaskStatus(accountId, taskId);
    return data;
  } catch (err) {
    throwApiError(err);
  }
}

export async function fetchTypes(
  accountId: number,
  toHubId: number
): Promise<Array<SandboxType> | void> {
  try {
    const { data } = await _fetchTypes(accountId, toHubId);
    return data && data.results;
  } catch (err) {
    throwApiError(err);
  }
}
