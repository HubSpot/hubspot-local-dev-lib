import findup from 'findup-sync';
import fs from 'fs-extra';

import { getCwd } from '../lib/path.js';
import {
  DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID,
  DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND,
  DEFAULT_ACCOUNT_OVERRIDE_FILE_NAME,
} from '../constants/config.js';
import { i18n } from '../utils/lang.js';
import { FileSystemError } from '../models/FileSystemError.js';
import { getAllConfigAccounts } from './index.js';

const i18nKey = 'config.defaultAccountOverride';

export function getDefaultAccountOverrideAccountId(): number | null {
  const defaultAccountOverrideFilePath = getDefaultAccountOverrideFilePath();

  if (!defaultAccountOverrideFilePath) {
    return null;
  }

  let source: string;
  try {
    source = fs.readFileSync(defaultAccountOverrideFilePath, 'utf8');
  } catch (e) {
    throw new FileSystemError(
      { cause: e },
      {
        filepath: defaultAccountOverrideFilePath,
        operation: 'read',
      }
    );
  }

  const accountId = parseInt(source);

  if (isNaN(accountId)) {
    throw new Error(
      i18n(`${i18nKey}.getDefaultAccountOverrideAccountId.errorHeader`, {
        hsAccountFile: defaultAccountOverrideFilePath,
      }),
      {
        // TODO: This is improper use of cause, we should create a custom error class
        cause: DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID,
      }
    );
  }

  const accounts = getAllConfigAccounts();

  const account = accounts?.find(account => account.accountId === accountId);
  if (!account) {
    throw new Error(
      i18n(`${i18nKey}.getDefaultAccountOverrideAccountId.errorHeader`, {
        hsAccountFile: defaultAccountOverrideFilePath,
      }),
      {
        // TODO: This is improper use of cause, we should create a custom error class
        cause: DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND,
      }
    );
  }

  return account.accountId;
}

export function getDefaultAccountOverrideFilePath(): string | null {
  return findup([DEFAULT_ACCOUNT_OVERRIDE_FILE_NAME], {
    cwd: getCwd(),
  });
}
