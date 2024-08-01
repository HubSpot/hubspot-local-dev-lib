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
  const { data } = await _createDeveloperTestAccount(accountId, accountName);
  return data;
}

export async function deleteDeveloperTestAccount(
  accountId: number,
  testAccountId: number
): Promise<void> {
  const { data } = await _deleteDeveloperTestAccount(accountId, testAccountId);
  return data;
}

export async function fetchDeveloperTestAccounts(
  accountId: number
): Promise<FetchDeveloperTestAccountsResponse> {
  const { data } = await _fetchDeveloperTestAccounts(accountId);
  return data;
}
