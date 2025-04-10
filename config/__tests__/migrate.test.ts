import fs from 'fs';
import path from 'path';
import os from 'os';

import {
  getConfigAtPath,
  migrateConfigAtPath,
  mergeConfigProperties,
  mergeConfigAccounts,
} from '../migrate';
import { HubSpotConfig } from '../../types/Config';
import {
  getGlobalConfigFilePath,
  readConfigFile,
  writeConfigFile,
} from '../utils';
import {
  DEFAULT_CMS_PUBLISH_MODE,
  HTTP_TIMEOUT,
  ENV,
  HTTP_USE_LOCALHOST,
  ALLOW_USAGE_TRACKING,
  DEFAULT_ACCOUNT,
} from '../../constants/config';
import { ENVIRONMENTS } from '../../constants/environments';
import { PERSONAL_ACCESS_KEY_AUTH_METHOD } from '../../constants/auth';
import { PersonalAccessKeyConfigAccount } from '../../types/Accounts';
import { createEmptyConfigFile } from '../index';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  unlinkSync: jest.fn(),
}));

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  readConfigFile: jest.fn(),
  writeConfigFile: jest.fn(),
  getGlobalConfigFilePath: jest.fn(),
}));

jest.mock('../index', () => ({
  ...jest.requireActual('../index'),
  createEmptyConfigFile: jest.fn(),
}));

describe('config/migrate', () => {
  let mockConfig: HubSpotConfig;
  let mockConfigSource: string;
  let mockConfigPath: string;
  let mockGlobalConfigPath: string;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      accounts: [
        {
          accountId: 123456,
          name: 'Test Account',
          authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
          personalAccessKey: 'test-key',
          env: ENVIRONMENTS.PROD,
          auth: {
            tokenInfo: {},
          },
        } as PersonalAccessKeyConfigAccount,
      ],
      defaultCmsPublishMode: 'draft',
      httpTimeout: 5000,
      env: ENVIRONMENTS.PROD,
      httpUseLocalhost: false,
      allowUsageTracking: true,
      defaultAccount: 123456,
    };

    mockConfigSource = JSON.stringify(mockConfig);
    mockConfigPath = '/path/to/config.yml';
    mockGlobalConfigPath = path.join(os.homedir(), '.hscli', 'config.yml');

    (readConfigFile as jest.Mock).mockReturnValue(mockConfigSource);
    (getGlobalConfigFilePath as jest.Mock).mockReturnValue(
      mockGlobalConfigPath
    );
  });

  describe('getConfigAtPath', () => {
    it('should read and parse config from the given path', () => {
      const result = getConfigAtPath(mockConfigPath);

      expect(readConfigFile).toHaveBeenCalledWith(mockConfigPath);
      expect(result).toEqual(mockConfig);
    });
  });

  describe('migrateConfigAtPath', () => {
    it('should migrate config from the given path to the global config path', () => {
      (createEmptyConfigFile as jest.Mock).mockImplementation(() => undefined);
      migrateConfigAtPath(mockConfigPath);

      expect(createEmptyConfigFile).toHaveBeenCalledWith(true);
      expect(readConfigFile).toHaveBeenCalledWith(mockConfigPath);
      expect(writeConfigFile).toHaveBeenCalledWith(
        mockConfig,
        mockGlobalConfigPath
      );
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockConfigPath);
    });
  });

  describe('mergeConfigProperties', () => {
    it('should merge properties from fromConfig to toConfig without conflicts when force is false', () => {
      // Arrange
      const toConfig: HubSpotConfig = {
        accounts: [],
        defaultCmsPublishMode: 'publish',
        httpTimeout: 3000,
        env: ENVIRONMENTS.QA,
        httpUseLocalhost: true,
        allowUsageTracking: false,
        defaultAccount: 654321,
      };

      const fromConfig: HubSpotConfig = {
        accounts: [],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
        httpUseLocalhost: false,
        allowUsageTracking: true,
        defaultAccount: 123456,
      };

      const result = mergeConfigProperties(toConfig, fromConfig);

      expect(result.configWithMergedProperties).toEqual(toConfig);
      expect(result.conflicts).toHaveLength(6);
      expect(result.conflicts).toContainEqual({
        property: DEFAULT_CMS_PUBLISH_MODE,
        oldValue: 'draft',
        newValue: 'publish',
      });
      expect(result.conflicts).toContainEqual({
        property: HTTP_TIMEOUT,
        oldValue: 5000,
        newValue: 3000,
      });
      expect(result.conflicts).toContainEqual({
        property: ENV,
        oldValue: ENVIRONMENTS.PROD,
        newValue: ENVIRONMENTS.QA,
      });
      expect(result.conflicts).toContainEqual({
        property: HTTP_USE_LOCALHOST,
        oldValue: false,
        newValue: true,
      });
      expect(result.conflicts).toContainEqual({
        property: ALLOW_USAGE_TRACKING,
        oldValue: true,
        newValue: false,
      });
      expect(result.conflicts).toContainEqual({
        property: DEFAULT_ACCOUNT,
        oldValue: 123456,
        newValue: 654321,
      });
    });

    it('should merge properties from fromConfig to toConfig without conflicts when force is true', () => {
      const toConfig: HubSpotConfig = {
        accounts: [],
        defaultCmsPublishMode: 'publish',
        httpTimeout: 3000,
        env: ENVIRONMENTS.QA,
        httpUseLocalhost: true,
        allowUsageTracking: false,
        defaultAccount: 654321,
      };

      const fromConfig: HubSpotConfig = {
        accounts: [],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
        httpUseLocalhost: false,
        allowUsageTracking: true,
        defaultAccount: 123456,
      };

      const result = mergeConfigProperties(toConfig, fromConfig, true);

      expect(result.configWithMergedProperties).toEqual({
        ...toConfig,
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
        httpUseLocalhost: false,
        allowUsageTracking: true,
        defaultAccount: 123456,
      });
      expect(result.conflicts).toHaveLength(0);
    });

    it('should merge properties from fromConfig to toConfig when toConfig has missing properties', () => {
      const toConfig: HubSpotConfig = {
        accounts: [],
      };

      const fromConfig: HubSpotConfig = {
        accounts: [],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
        httpUseLocalhost: false,
        allowUsageTracking: true,
        defaultAccount: 123456,
      };

      const result = mergeConfigProperties(toConfig, fromConfig);

      expect(result.configWithMergedProperties).toEqual({
        ...toConfig,
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
        httpUseLocalhost: false,
        allowUsageTracking: true,
        defaultAccount: 123456,
      });
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('mergeConfigAccounts', () => {
    it('should merge accounts from fromConfig to toConfig and skip existing accounts', () => {
      const existingAccount = {
        accountId: 123456,
        name: 'Existing Account',
        authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
        personalAccessKey: 'existing-key',
        env: ENVIRONMENTS.PROD,
        auth: {
          tokenInfo: {},
        },
      } as PersonalAccessKeyConfigAccount;

      const newAccount = {
        accountId: 789012,
        name: 'New Account',
        authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
        personalAccessKey: 'new-key',
        env: ENVIRONMENTS.PROD,
        auth: {
          tokenInfo: {},
        },
      } as PersonalAccessKeyConfigAccount;

      const toConfig: HubSpotConfig = {
        accounts: [existingAccount],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
      };

      const fromConfig: HubSpotConfig = {
        accounts: [existingAccount, newAccount],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
      };

      const result = mergeConfigAccounts(toConfig, fromConfig);

      expect(result.configWithMergedAccounts.accounts).toHaveLength(2);
      expect(result.configWithMergedAccounts.accounts).toContainEqual(
        existingAccount
      );
      expect(result.configWithMergedAccounts.accounts).toContainEqual(
        newAccount
      );
      expect(result.skippedAccountIds).toEqual([123456]);
      expect(writeConfigFile).toHaveBeenCalledWith(
        result.configWithMergedAccounts,
        mockGlobalConfigPath
      );
    });

    it('should handle empty accounts arrays', () => {
      const toConfig: HubSpotConfig = {
        accounts: [],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
      };

      const fromConfig: HubSpotConfig = {
        accounts: [],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
      };

      const result = mergeConfigAccounts(toConfig, fromConfig);

      expect(result.configWithMergedAccounts.accounts).toHaveLength(0);
      expect(result.skippedAccountIds).toEqual([]);
      expect(writeConfigFile).toHaveBeenCalledWith(
        result.configWithMergedAccounts,
        mockGlobalConfigPath
      );
    });

    it('should handle case when fromConfig has no accounts', () => {
      const existingAccount = {
        accountId: 123456,
        name: 'Existing Account',
        authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
        personalAccessKey: 'existing-key',
        env: ENVIRONMENTS.PROD,
        auth: {
          tokenInfo: {},
        },
      } as PersonalAccessKeyConfigAccount;

      const toConfig: HubSpotConfig = {
        accounts: [existingAccount],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
      };

      const fromConfig: HubSpotConfig = {
        accounts: [],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
      };

      const result = mergeConfigAccounts(toConfig, fromConfig);

      expect(result.configWithMergedAccounts.accounts).toHaveLength(1);
      expect(result.configWithMergedAccounts.accounts).toContainEqual(
        existingAccount
      );
      expect(result.skippedAccountIds).toEqual([]);
      expect(writeConfigFile).toHaveBeenCalledWith(
        result.configWithMergedAccounts,
        mockGlobalConfigPath
      );
    });

    it('should handle case when toConfig has no accounts', () => {
      const newAccount = {
        accountId: 789012,
        name: 'New Account',
        authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
        personalAccessKey: 'new-key',
        env: ENVIRONMENTS.PROD,
        auth: {
          tokenInfo: {},
        },
      } as PersonalAccessKeyConfigAccount;

      const toConfig: HubSpotConfig = {
        accounts: [],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
      };

      const fromConfig: HubSpotConfig = {
        accounts: [newAccount],
        defaultCmsPublishMode: 'draft',
        httpTimeout: 5000,
        env: ENVIRONMENTS.PROD,
      };

      const result = mergeConfigAccounts(toConfig, fromConfig);

      expect(result.configWithMergedAccounts.accounts).toHaveLength(1);
      expect(result.configWithMergedAccounts.accounts).toContainEqual(
        newAccount
      );
      expect(result.skippedAccountIds).toEqual([]);
      expect(writeConfigFile).toHaveBeenCalledWith(
        result.configWithMergedAccounts,
        mockGlobalConfigPath
      );
    });
  });
});
