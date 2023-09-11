/* eslint-disable no-useless-catch */
import {
  createSandbox as _createSandbox,
  deleteSandbox as _deleteSandbox,
  getSandboxUsageLimits as _getSandboxUsageLimits,
} from './api/sandboxHubs';
import {
  initiateSync as _initiateSync,
  fetchTaskStatus as _fetchTaskStatus,
  fetchTypes as _fetchTypes,
} from './api/sandboxesSync';
import {
  InitiateSyncResponse,
  Sandbox,
  SandboxType,
  SyncTask,
  Task,
  Usage,
} from './types/Sandbox';

export async function createSandbox(
  accountId: number,
  name: string,
  type: string
): Promise<{
  name: string;
  sandbox: Sandbox;
  personalAccessKey: string;
} | void> {
  let resp;

  try {
    resp = await _createSandbox(accountId, name, type);
  } catch (err) {
    throw err;
  }

  return {
    name,
    ...resp,
  };
}

export async function deleteSandbox(
  parentAccountId: number,
  sandboxAccountId: number
): Promise<{ parentAccountId: number; sandboxAccountId: number } | void> {
  try {
    await _deleteSandbox(parentAccountId, sandboxAccountId);
  } catch (err) {
    throw err;
  }

  return {
    parentAccountId,
    sandboxAccountId,
  };
}

export async function getSandboxUsageLimits(
  parentAccountId: number
): Promise<Usage | void> {
  let resp;

  try {
    resp = await _getSandboxUsageLimits(parentAccountId);
  } catch (err) {
    throw err;
  }

  return resp && resp.usage;
}

export async function initiateSync(
  fromHubId: number,
  toHubId: number,
  tasks: Array<SyncTask>,
  sandboxHubId: number
): Promise<InitiateSyncResponse | void> {
  let resp;

  try {
    resp = await _initiateSync(fromHubId, toHubId, tasks, sandboxHubId);
  } catch (err) {
    throw err;
  }

  return resp;
}

export async function fetchTaskStatus(
  accountId: number,
  taskId: number
): Promise<Task | void> {
  let resp;

  try {
    resp = await _fetchTaskStatus(accountId, taskId);
  } catch (err) {
    throw err;
  }

  return resp;
}

export async function fetchTypes(
  accountId: number,
  toHubId: number
): Promise<Array<SandboxType> | void> {
  let resp;

  try {
    resp = await _fetchTypes(accountId, toHubId);
  } catch (err) {
    throw err;
  }

  return resp && resp.results;
}
