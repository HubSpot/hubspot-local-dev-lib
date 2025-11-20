import findup from 'findup-sync';
import fs from 'fs-extra';
import yaml from 'js-yaml';

import {
  localConfigFileExists,
  globalConfigFileExists,
  getConfigFilePath,
  getConfig,
  isConfigValid,
  createEmptyConfigFile,
  deleteConfigFileIfEmpty,
  getConfigAccountById,
  getConfigAccountByName,
  getConfigDefaultAccount,
  getAllConfigAccounts,
  getConfigAccountEnvironment,
  addConfigAccount,
  updateConfigAccount,
  setConfigAccountAsDefault,
  renameConfigAccount,
  removeAccountFromConfig,
  updateHttpTimeout,
  updateAllowUsageTracking,
  updateDefaultCmsPublishMode,
  isConfigFlagEnabled,
  getGlobalConfigFilePath,
  getLocalConfigFilePathIfExists,
} from '../index';
import { HubSpotConfigAccount } from '../../types/Accounts';
import { HubSpotConfig } from '../../types/Config';
import {
  PersonalAccessKeyConfigAccount,
  OAuthConfigAccount,
  APIKeyConfigAccount,
} from '../../types/Accounts';
import {
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  API_KEY_AUTH_METHOD,
} from '../../constants/auth';
import { getLocalConfigDefaultFilePath, formatConfigForWrite } from '../utils';
import { getDefaultAccountOverrideAccountId } from '../defaultAccountOverride';
import {
  CONFIG_FLAGS,
  ENVIRONMENT_VARIABLES,
  HUBSPOT_CONFIGURATION_FOLDER,
} from '../../constants/config';
import * as utils from '../utils';
import { CmsPublishMode } from '../../types/Files';

jest.mock('findup-sync');
jest.mock('../../lib/path');
jest.mock('fs-extra');
jest.mock('../defaultAccountOverride');

const mockFindup = findup as jest.MockedFunction<typeof findup>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockGetDefaultAccountOverrideAccountId =
  getDefaultAccountOverrideAccountId as jest.MockedFunction<
    typeof getDefaultAccountOverrideAccountId
  >;

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

const OAUTH_ACCOUNT: OAuthConfigAccount = {
  accountId: 234,
  env: 'qa',
  name: '234',
  authType: OAUTH_AUTH_METHOD.value,
  accountType: undefined,
  auth: {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    tokenInfo: {
      refreshToken: 'test-refresh-token',
    },
    scopes: ['content', 'hubdb', 'files'],
  },
};

const API_KEY_ACCOUNT: APIKeyConfigAccount = {
  accountId: 345,
  env: 'qa',
  name: 'api-key-account',
  authType: API_KEY_AUTH_METHOD.value,
  apiKey: 'test-api-key',
  accountType: 'STANDARD',
};

const CONFIG: HubSpotConfig = {
  defaultAccount: PAK_ACCOUNT.accountId,
  accounts: [PAK_ACCOUNT],
  defaultCmsPublishMode: 'publish',
  httpTimeout: 1000,
  httpUseLocalhost: true,
  allowUsageTracking: true,
};

function cleanup() {
  Object.keys(ENVIRONMENT_VARIABLES).forEach(key => {
    delete process.env[key];
  });
  mockFs.existsSync.mockReset();
  mockFs.readFileSync.mockReset();
  mockFs.writeFileSync.mockReset();
  mockFs.unlinkSync.mockReset();
  mockFindup.mockReset();
  jest.restoreAllMocks();
}

function mockConfig(config = CONFIG) {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValueOnce('test-config-content');
  jest.spyOn(utils, 'parseConfig').mockReturnValueOnce(structuredClone(config));
}

describe('config/index', () => {
  afterEach(() => {
    cleanup();
  });

  describe('getGlobalConfigFilePath()', () => {
    it('returns the global config file path', () => {
      const globalConfigFilePath = getGlobalConfigFilePath();
      expect(globalConfigFilePath).toBeDefined();
      expect(globalConfigFilePath).toContain(
        `${HUBSPOT_CONFIGURATION_FOLDER}/config.yml`
      );
    });
  });

  describe('getLocalConfigFilePathIfExists()', () => {
    it('returns the nearest config file path', () => {
      const mockConfigPath = '/mock/path/hubspot.config.yml';
      mockFindup.mockReturnValue(mockConfigPath);

      const localConfigPath = getLocalConfigFilePathIfExists();
      expect(localConfigPath).toBe(mockConfigPath);
    });

    it('returns null if no config file found', () => {
      mockFindup.mockReturnValue(null);
      const localConfigPath = getLocalConfigFilePathIfExists();
      expect(localConfigPath).toBeNull();
    });
  });

  describe('localConfigFileExists()', () => {
    it('returns true when local config exists', () => {
      mockFindup.mockReturnValueOnce(getLocalConfigDefaultFilePath());
      expect(localConfigFileExists()).toBe(true);
    });

    it('returns false when local config does not exist', () => {
      mockFindup.mockReturnValueOnce(null);
      expect(localConfigFileExists()).toBe(false);
    });
  });

  describe('globalConfigFileExists()', () => {
    it('returns true when global config exists', () => {
      mockFs.existsSync.mockReturnValueOnce(true);
      expect(globalConfigFileExists()).toBe(true);
    });

    it('returns false when global config does not exist', () => {
      mockFs.existsSync.mockReturnValueOnce(false);
      expect(globalConfigFileExists()).toBe(false);
    });
  });

  describe('getConfigFilePath()', () => {
    it('returns environment path when set', () => {
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_CONFIG_PATH] =
        'test-environment-path';
      expect(getConfigFilePath()).toBe('test-environment-path');
    });

    it('returns global path when exists', () => {
      mockFs.existsSync.mockReturnValueOnce(true);
      expect(getConfigFilePath()).toBe(getGlobalConfigFilePath());
    });

    it('returns local path when global does not exist', () => {
      mockFs.existsSync.mockReturnValueOnce(false);
      mockFindup.mockReturnValueOnce(getLocalConfigDefaultFilePath());
      expect(getConfigFilePath()).toBe(getLocalConfigDefaultFilePath());
    });
  });

  describe('getConfig()', () => {
    it('returns environment config when enabled', () => {
      process.env[ENVIRONMENT_VARIABLES.USE_ENVIRONMENT_HUBSPOT_CONFIG] =
        'true';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ACCOUNT_ID] = '234';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT] = 'qa';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_API_KEY] = 'test-api-key';
      expect(getConfig()).toEqual({
        defaultAccount: 234,
        accounts: [
          {
            accountId: 234,
            name: '234',
            env: 'qa',
            apiKey: 'test-api-key',
            authType: API_KEY_AUTH_METHOD.value,
          },
        ],
      });
    });

    it('returns parsed config from file', () => {
      mockConfig();
      expect(getConfig()).toEqual(CONFIG);
    });
  });

  describe('isConfigValid()', () => {
    it('returns true for valid config', () => {
      mockConfig();

      expect(isConfigValid()).toBe(true);
    });

    it('returns false for config with no accounts', () => {
      mockConfig({ accounts: [] });

      expect(isConfigValid()).toBe(false);
    });

    it('returns false for config with duplicate account ids', () => {
      mockConfig({ accounts: [PAK_ACCOUNT, PAK_ACCOUNT] });

      expect(isConfigValid()).toBe(false);
    });
  });

  describe('createEmptyConfigFile()', () => {
    it('creates global config when specified', () => {
      mockFs.existsSync.mockReturnValueOnce(true);
      createEmptyConfigFile(true);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getGlobalConfigFilePath(),
        yaml.dump({ accounts: [] })
      );
    });

    it('creates local config by default', () => {
      mockFs.existsSync.mockReturnValueOnce(true);
      createEmptyConfigFile(false);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getLocalConfigDefaultFilePath(),
        yaml.dump({ accounts: [] })
      );
    });
  });

  describe('deleteConfigFileIfEmpty()', () => {
    it('deletes the config file if it is empty', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValueOnce(yaml.dump({ accounts: [] }));
      jest
        .spyOn(utils, 'parseConfig')
        .mockReturnValueOnce({ accounts: [] } as HubSpotConfig);
      deleteConfigFileIfEmpty();

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(getConfigFilePath());
    });

    it('does not delete the config file if it is not empty', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValueOnce(yaml.dump(CONFIG));
      jest
        .spyOn(utils, 'parseConfig')
        .mockReturnValueOnce(structuredClone(CONFIG));
      deleteConfigFileIfEmpty();

      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('getConfigAccountById()', () => {
    it('returns account when found', () => {
      mockConfig();

      expect(getConfigAccountById(123)).toEqual(PAK_ACCOUNT);
    });

    it('throws when account not found', () => {
      mockConfig();

      expect(() => getConfigAccountById(456)).toThrow();
    });
  });

  describe('getConfigAccountByName()', () => {
    it('returns account when found', () => {
      mockConfig();

      expect(getConfigAccountByName('test-account')).toEqual(PAK_ACCOUNT);
    });

    it('throws when account not found', () => {
      mockConfig();

      expect(() => getConfigAccountByName('non-existent-account')).toThrow();
    });
  });

  describe('getConfigDefaultAccount()', () => {
    it('returns default account when set', () => {
      mockConfig();

      expect(getConfigDefaultAccount()).toEqual(PAK_ACCOUNT);
    });

    it('throws when no default account', () => {
      mockConfig({ accounts: [] });

      expect(() => getConfigDefaultAccount()).toThrow();
    });

    it('returns the correct account when default account override is set', () => {
      mockConfig({ accounts: [PAK_ACCOUNT, OAUTH_ACCOUNT] });
      mockGetDefaultAccountOverrideAccountId.mockReturnValueOnce(
        OAUTH_ACCOUNT.accountId
      );

      expect(getConfigDefaultAccount()).toEqual(OAUTH_ACCOUNT);
    });
  });

  describe('getAllConfigAccounts()', () => {
    it('returns all accounts', () => {
      mockConfig();

      expect(getAllConfigAccounts()).toEqual([PAK_ACCOUNT]);
    });
  });

  describe('getConfigAccountEnvironment()', () => {
    it('returns environment for specified account', () => {
      mockConfig();

      expect(getConfigAccountEnvironment(123)).toEqual('qa');
    });
  });

  describe('addConfigAccount()', () => {
    it('adds valid account to config', () => {
      mockConfig();
      mockFs.writeFileSync.mockImplementationOnce(() => undefined);
      addConfigAccount(OAUTH_ACCOUNT);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getConfigFilePath(),
        yaml.dump(
          formatConfigForWrite({
            ...CONFIG,
            accounts: [PAK_ACCOUNT, OAUTH_ACCOUNT],
          })
        )
      );
    });

    it('throws for invalid account', () => {
      expect(() =>
        addConfigAccount({
          ...PAK_ACCOUNT,
          personalAccessKey: null,
        } as unknown as HubSpotConfigAccount)
      ).toThrow();
    });

    it('throws when account already exists', () => {
      mockConfig();

      expect(() => addConfigAccount(PAK_ACCOUNT)).toThrow();
    });
  });

  describe('updateConfigAccount()', () => {
    it('updates existing account', () => {
      mockConfig();

      const newAccount = { ...PAK_ACCOUNT, name: 'new-name' };

      updateConfigAccount(newAccount);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getConfigFilePath(),
        yaml.dump(formatConfigForWrite({ ...CONFIG, accounts: [newAccount] }))
      );
    });
    it('throws for invalid account', () => {
      expect(() =>
        updateConfigAccount({
          ...PAK_ACCOUNT,
          personalAccessKey: null,
        } as unknown as HubSpotConfigAccount)
      ).toThrow();
    });

    it('throws when account not found', () => {
      mockConfig();

      expect(() => updateConfigAccount(OAUTH_ACCOUNT)).toThrow();
    });
  });

  describe('setConfigAccountAsDefault()', () => {
    it('sets account as default by id', () => {
      const config = { ...CONFIG, accounts: [PAK_ACCOUNT, API_KEY_ACCOUNT] };
      mockConfig(config);

      setConfigAccountAsDefault(345);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getConfigFilePath(),
        yaml.dump(formatConfigForWrite({ ...config, defaultAccount: 345 }))
      );
    });

    it('sets account as default by name', () => {
      const config = { ...CONFIG, accounts: [PAK_ACCOUNT, API_KEY_ACCOUNT] };
      mockConfig(config);

      setConfigAccountAsDefault('api-key-account');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getConfigFilePath(),
        yaml.dump(formatConfigForWrite({ ...config, defaultAccount: 345 }))
      );
    });

    it('throws when account not found', () => {
      expect(() => setConfigAccountAsDefault('non-existent-account')).toThrow();
    });
  });

  describe('renameConfigAccount()', () => {
    it('renames existing account', () => {
      mockConfig();

      renameConfigAccount('test-account', 'new-name');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getConfigFilePath(),
        yaml.dump(
          formatConfigForWrite({
            ...CONFIG,
            accounts: [{ ...PAK_ACCOUNT, name: 'new-name' }],
          })
        )
      );
    });

    it('throws when account not found', () => {
      expect(() =>
        renameConfigAccount('non-existent-account', 'new-name')
      ).toThrow();
    });

    it('throws when new name already exists', () => {
      const config = { ...CONFIG, accounts: [PAK_ACCOUNT, API_KEY_ACCOUNT] };
      mockConfig(config);

      expect(() =>
        renameConfigAccount('test-account', 'api-key-account')
      ).toThrow();
    });
  });

  describe('removeAccountFromConfig()', () => {
    it('removes existing account', () => {
      mockConfig();

      removeAccountFromConfig(123);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getConfigFilePath(),
        yaml.dump(
          formatConfigForWrite({
            ...CONFIG,
            accounts: [],
            defaultAccount: undefined,
          })
        )
      );
    });

    it('throws when account not found', () => {
      mockConfig();

      expect(() => removeAccountFromConfig(456)).toThrow();
    });
  });

  describe('updateHttpTimeout()', () => {
    it('updates timeout value', () => {
      mockConfig();

      updateHttpTimeout(4000);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getConfigFilePath(),
        yaml.dump(formatConfigForWrite({ ...CONFIG, httpTimeout: 4000 }))
      );
    });

    it('throws for invalid timeout', () => {
      expect(() => updateHttpTimeout('invalid-timeout')).toThrow();
    });
  });

  describe('updateAllowUsageTracking()', () => {
    it('updates tracking setting', () => {
      mockConfig();
      updateAllowUsageTracking(false);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getConfigFilePath(),
        yaml.dump(
          formatConfigForWrite({ ...CONFIG, allowUsageTracking: false })
        )
      );
    });
  });

  describe('updateDefaultCmsPublishMode()', () => {
    it('updates publish mode', () => {
      mockConfig();

      updateDefaultCmsPublishMode('draft');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        getConfigFilePath(),
        yaml.dump(
          formatConfigForWrite({ ...CONFIG, defaultCmsPublishMode: 'draft' })
        )
      );
    });

    it('throws for invalid mode', () => {
      expect(() =>
        updateDefaultCmsPublishMode('invalid-mode' as unknown as CmsPublishMode)
      ).toThrow();
    });
  });

  describe('isConfigFlagEnabled()', () => {
    it('returns flag value when set', () => {
      mockConfig({
        ...CONFIG,
        [CONFIG_FLAGS.USE_CUSTOM_OBJECT_HUBFILE]: true,
      });

      expect(isConfigFlagEnabled(CONFIG_FLAGS.USE_CUSTOM_OBJECT_HUBFILE)).toBe(
        true
      );
    });

    it('returns default value when not set', () => {
      mockConfig();

      expect(
        isConfigFlagEnabled(CONFIG_FLAGS.USE_CUSTOM_OBJECT_HUBFILE, true)
      ).toBe(true);
    });
  });
});
