import { vi, describe, it, expect, MockedFunction, Mocked } from 'vitest';
import fs from 'fs-extra';
import findup from 'findup-sync';
import {
  getDefaultAccountOverrideAccountId,
  getDefaultAccountOverrideFilePath,
} from '../defaultAccountOverride';
import { PersonalAccessKeyConfigAccount } from '../../types/Accounts';
import { PERSONAL_ACCESS_KEY_AUTH_METHOD } from '../../constants/auth';

vi.mock('fs-extra');
vi.mock('findup-sync');

const mockFs = fs as Mocked<typeof fs>;
const mockFindup = findup as MockedFunction<typeof findup>;

const PAK_ACCOUNT: PersonalAccessKeyConfigAccount = {
  name: 'test-account',
  accountId: 123,
  authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
  personalAccessKey: 'test-key',
  env: 'qa',
  auth: {
    tokenInfo: {},
  },
  accountType: 'STANDARD',
};

describe('defaultAccountOverride', () => {
  describe('getDefaultAccountOverrideAccountId()', () => {
    it('returns null when override file does not exist', () => {
      mockFindup.mockReturnValueOnce(null);
      expect(getDefaultAccountOverrideAccountId([PAK_ACCOUNT])).toBeNull();
    });

    it('throws an error when override file exists but is not a number', () => {
      mockFindup.mockReturnValueOnce('.hsaccount');
      mockFs.readFileSync.mockReturnValueOnce('string');
      expect(() => getDefaultAccountOverrideAccountId([PAK_ACCOUNT])).toThrow();
    });

    it('throws an error when account specified in override file does not exist in config', () => {
      mockFindup.mockReturnValueOnce('.hsaccount');
      mockFs.readFileSync.mockReturnValueOnce('234');
      expect(() => getDefaultAccountOverrideAccountId([PAK_ACCOUNT])).toThrow();
    });

    it('returns the account ID when an account with that ID exists in config', () => {
      mockFindup.mockReturnValueOnce('.hsaccount');
      mockFs.readFileSync.mockReturnValueOnce('123');
      expect(getDefaultAccountOverrideAccountId([PAK_ACCOUNT])).toBe(123);
    });
  });

  describe('getDefaultAccountOverrideFilePath()', () => {
    it('returns the path to the override file if one exists', () => {
      mockFindup.mockReturnValueOnce('.hsaccount');
      expect(getDefaultAccountOverrideFilePath()).toBe('.hsaccount');
    });

    it('returns null if no override file exists', () => {
      mockFindup.mockReturnValueOnce(null);
      expect(getDefaultAccountOverrideFilePath()).toBeNull();
    });
  });
});
