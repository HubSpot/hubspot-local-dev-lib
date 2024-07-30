import {
  createDeveloperTestAccount as _createDeveloperTestAccount,
  fetchDeveloperTestAccounts as _fetchDeveloperTestAccounts,
  deleteDeveloperTestAccount as _deleteDeveloperTestAccount,
} from '../api/developerTestAccounts';

import { throwApiError } from '../errors/apiErrors';
import {
  DeveloperTestAccount,
  FetchDeveloperTestAccountsResponse,
} from '../types/developerTestAccounts';

export async function createDeveloperTestAccount(
  accountId: number,
  accountName: string
): Promise<DeveloperTestAccount> {
  try {
    const { data } = await _createDeveloperTestAccount(accountId, accountName);
    return data;
  } catch (err) {
    throwApiError(err);
  }
}

export async function deleteDeveloperTestAccount(
  accountId: number,
  testAccountId: number
): Promise<void> {
  try {
    const { data } = await _deleteDeveloperTestAccount(
      accountId,
      testAccountId
    );
    return data;
  } catch (err) {
    throwApiError(err);
  }
}

export async function fetchDeveloperTestAccounts(
  accountId: number
): Promise<FetchDeveloperTestAccountsResponse> {
  try {
    const { data } = await _fetchDeveloperTestAccounts(accountId);
    return data;
  } catch (err) {
    throwApiError(err);
  }
}
