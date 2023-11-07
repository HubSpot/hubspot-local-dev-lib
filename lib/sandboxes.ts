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
  SyncTask,
  Task,
  Usage,
} from '../types/Sandbox';
import { throwErrorWithMessage } from '../errors/standardErrors';
import { BaseError } from '../types/Error';

const i18nKey = 'lib.sandboxes';

export async function createSandbox(
  accountId: number,
  name: string,
  type: string
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
    throwErrorWithMessage(
      `${i18nKey}.errors.createSandbox`,
      {},
      err as BaseError
    );
  }
}

export async function deleteSandbox(
  parentAccountId: number,
  sandboxAccountId: number
): Promise<{ parentAccountId: number; sandboxAccountId: number }> {
  try {
    await _deleteSandbox(parentAccountId, sandboxAccountId);
  } catch (err) {
    throwErrorWithMessage(
      `${i18nKey}.errors.deleteSandbox`,
      {},
      err as BaseError
    );
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
    throwErrorWithMessage(
      `${i18nKey}.errors.getSandboxUsageLimits`,
      {},
      err as BaseError
    );
  }
}

export async function initiateSync(
  fromHubId: number,
  toHubId: number,
  tasks: Array<SyncTask>,
  sandboxHubId: number
): Promise<InitiateSyncResponse> {
  try {
    return await _initiateSync(fromHubId, toHubId, tasks, sandboxHubId);
  } catch (err) {
    throwErrorWithMessage(
      `${i18nKey}.errors.initiateSync`,
      {},
      err as BaseError
    );
  }
}

export async function fetchTaskStatus(
  accountId: number,
  taskId: number
): Promise<Task> {
  try {
    return await _fetchTaskStatus(accountId, taskId);
  } catch (err) {
    throwErrorWithMessage(
      `${i18nKey}.errors.fetchTaskStatus`,
      {},
      err as BaseError
    );
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
    throwErrorWithMessage(`${i18nKey}.errors.fetchTypes`, {}, err as BaseError);
  }
}
