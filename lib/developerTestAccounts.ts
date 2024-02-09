import {
  createDeveloperTestAccount as _createDeveloperTestAccount,
  fetchDeveloperTestAccounts as _fetchDeveloperTestAccounts,
  deleteDeveloperTestAccount as _deleteDeveloperTestAccount,
} from '../api/developerTestAccounts';

import { AxiosError } from 'axios';
import { throwApiError } from '../errors/apiErrors';
import { DeveloperTestAccount } from '../types/testAccounts';

export async function createDeveloperTestAccount(
  accountId: number,
  accountName: string
): Promise<DeveloperTestAccount> {
  try {
    const resp = await _createDeveloperTestAccount(accountId, accountName);
    return resp;
  } catch (err) {
    throwApiError(err as AxiosError);
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
    throwApiError(err as AxiosError);
  }
}

export async function fetchDeveloperTestAccounts(
  accountId: number
): Promise<DeveloperTestAccount[]> {
  try {
    const resp = await _fetchDeveloperTestAccounts(accountId);
    return resp.results;
  } catch (err) {
    throwApiError(err as AxiosError);
  }
}
