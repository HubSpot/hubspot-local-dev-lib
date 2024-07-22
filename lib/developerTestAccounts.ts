import {
  createDeveloperTestAccount as _createDeveloperTestAccount,
  fetchDeveloperTestAccounts as _fetchDeveloperTestAccounts,
  deleteDeveloperTestAccount as _deleteDeveloperTestAccount,
} from '../api/developerTestAccounts';

import {
  DeveloperTestAccount,
  FetchDeveloperTestAccountsResponse,
} from '../types/developerTestAccounts';

export async function createDeveloperTestAccount(
  accountId: number,
  accountName: string
): Promise<DeveloperTestAccount> {
  return _createDeveloperTestAccount(accountId, accountName);
}

export async function deleteDeveloperTestAccount(
  accountId: number,
  testAccountId: number
): Promise<void> {
  return _deleteDeveloperTestAccount(accountId, testAccountId);
}

export async function fetchDeveloperTestAccounts(
  accountId: number
): Promise<FetchDeveloperTestAccountsResponse> {
  return _fetchDeveloperTestAccounts(accountId);
}
