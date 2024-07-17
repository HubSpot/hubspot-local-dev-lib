import {
  createDeveloperTestAccount as _createDeveloperTestAccount,
  fetchDeveloperTestAccounts as _fetchDeveloperTestAccounts,
  deleteDeveloperTestAccount as _deleteDeveloperTestAccount,
} from '../api/developerTestAccounts';

import {
  DeveloperTestAccount,
  FetchDeveloperTestAccountsResponse,
} from '../types/developerTestAccounts';
import { throwError } from '../errors/standardErrors';

export async function createDeveloperTestAccount(
  accountId: number,
  accountName: string
): Promise<DeveloperTestAccount> {
  try {
    const resp = await _createDeveloperTestAccount(accountId, accountName);
    return resp;
  } catch (err) {
    throwError(err);
  }
}

export async function deleteDeveloperTestAccount(
  accountId: number,
  testAccountId: number
): Promise<void> {
  try {
    const resp = await _deleteDeveloperTestAccount(accountId, testAccountId);
    return resp;
  } catch (err) {
    throwError(err);
  }
}

export async function fetchDeveloperTestAccounts(
  accountId: number
): Promise<FetchDeveloperTestAccountsResponse> {
  try {
    const resp = await _fetchDeveloperTestAccounts(accountId);
    return resp;
  } catch (err) {
    throwError(err);
  }
}
