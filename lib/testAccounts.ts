import {
  createTestAccount as _createTestAccount,
  fetchTestAccounts as _fetchTestAccounts,
  deleteTestAccount as _deleteTestAccount,
} from '../api/testAccounts';

import { AxiosError } from 'axios';
import { throwApiError } from '../errors/apiErrors';
import { DeveloperTestAccount } from '../types/testAccounts';

export async function createTestAccount(
  accountId: number,
  accountName: string
): Promise<DeveloperTestAccount> {
  try {
    const resp = await _createTestAccount(accountId, accountName);
    return resp;
  } catch (err) {
    throwApiError(err as AxiosError);
  }
}

export async function deleteTestAccount(
  accountId: number,
  testAccountId: number
): Promise<void> {
  try {
    const resp = await _deleteTestAccount(accountId, testAccountId);
    return resp;
  } catch (err) {
    throwApiError(err as AxiosError);
  }
}

export async function fetchTestAccounts(
  accountId: number
): Promise<DeveloperTestAccount[]> {
  try {
    const resp = await _fetchTestAccounts(accountId);
    return resp.results;
  } catch (err) {
    throwApiError(err as AxiosError);
  }
}
