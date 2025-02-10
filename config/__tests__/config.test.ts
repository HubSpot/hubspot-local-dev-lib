import findup from 'findup-sync';
import fs from 'fs-extra';

import {
  localConfigFileExists,
  globalConfigFileExists,
  getConfigFilePath,
  getConfig,
  isConfigValid,
  createEmptyConfigFile,
  deleteConfigFile,
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
} from '../index';
import { HubSpotConfigAccount } from '../../types/Accounts';
import { HubSpotConfig } from '../../types/Config';
import { getCwd } from '../../lib/path';
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
import {
  getGlobalConfigFilePath,
  getLocalConfigFileDefaultPath,
} from '../utils';
import { ENVIRONMENT_VARIABLES } from '../../constants/config';
import * as utils from '../utils';

jest.mock('findup-sync');
jest.mock('../../lib/path');
jest.mock('fs-extra');

const mockFindup = findup as jest.MockedFunction<typeof findup>;
const mockCwd = getCwd as jest.MockedFunction<typeof getCwd>;
const mockFs = fs as jest.Mocked<typeof fs>;

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
  accountId: 123,
  env: 'qa',
  name: '123',
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
  accountId: 123,
  env: 'qa',
  name: '123',
  authType: API_KEY_AUTH_METHOD.value,
  accountType: undefined,
  apiKey: 'test-api-key',
};

const CONFIG: HubSpotConfig = {
  defaultAccount: PAK_ACCOUNT.accountId,
  accounts: [PAK_ACCOUNT],
  defaultCmsPublishMode: 'publish',
  httpTimeout: 1000,
  httpUseLocalhost: true,
  allowUsageTracking: true,
};

function cleanupEnvironmentVariables() {
  Object.keys(ENVIRONMENT_VARIABLES).forEach(key => {
    delete process.env[key];
  });
}

describe('config/index', () => {
  beforeEach(() => {
    cleanupEnvironmentVariables();
  });

  afterEach(() => {
    cleanupEnvironmentVariables();
  });

  describe('localConfigFileExists()', () => {
    it('returns true when local config exists', () => {
      mockFindup.mockReturnValueOnce(getLocalConfigFileDefaultPath());
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
      mockFindup.mockReturnValueOnce(getLocalConfigFileDefaultPath());
      expect(getConfigFilePath()).toBe(getLocalConfigFileDefaultPath());
    });
  });

  describe('getConfig()', () => {
    it('returns environment config when enabled', () => {
      process.env[ENVIRONMENT_VARIABLES.USE_ENVIRONMENT_CONFIG] = 'true';
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
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.readFileSync.mockReturnValueOnce('test-config-content');
      jest.spyOn(utils, 'parseConfig').mockReturnValueOnce(CONFIG);

      expect(getConfig()).toEqual(CONFIG);
    });
  });

  describe('isConfigValid()', () => {
    it('returns true for valid config', () => {
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.readFileSync.mockReturnValueOnce('test-config-content');
      jest.spyOn(utils, 'parseConfig').mockReturnValueOnce(CONFIG);

      expect(isConfigValid()).toBe(true);
    });

    it('returns false for config with no accounts', () => {
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.readFileSync.mockReturnValueOnce('test-config-content');
      jest.spyOn(utils, 'parseConfig').mockReturnValueOnce({ accounts: [] });

      expect(isConfigValid()).toBe(false);
    });

    it('returns false for config with duplicate account ids', () => {
      mockFs.existsSync.mockReturnValueOnce(true);
      mockFs.readFileSync.mockReturnValueOnce('test-config-content');
      jest
        .spyOn(utils, 'parseConfig')
        .mockReturnValueOnce({ accounts: [PAK_ACCOUNT, PAK_ACCOUNT] });

      expect(isConfigValid()).toBe(false);
    });
  });

  describe('createEmptyConfigFile()', () => {
    it('creates global config when specified', () => {
      // TODO: Implement test
    });

    it('creates local config by default', () => {
      // TODO: Implement test
    });
  });

  describe('deleteConfigFile()', () => {
    it('deletes the config file', () => {});
  });

  describe('getConfigAccountById()', () => {
    it('returns account when found', () => {
      // TODO: Implement test
    });

    it('throws when account not found', () => {
      // TODO: Implement test
    });
  });

  describe('getConfigAccountByName()', () => {
    it('returns account when found', () => {
      // TODO: Implement test
    });

    it('throws when account not found', () => {
      // TODO: Implement test
    });
  });

  describe('getConfigDefaultAccount()', () => {
    it('returns default account when set', () => {
      // TODO: Implement test
    });

    it('throws when no default account', () => {
      // TODO: Implement test
    });
  });

  describe('getAllConfigAccounts()', () => {
    it('returns all accounts', () => {
      // TODO: Implement test
    });
  });

  describe('getConfigAccountEnvironment()', () => {
    it('returns environment for specified account', () => {
      // TODO: Implement test
    });

    it('returns default account environment when no identifier', () => {
      // TODO: Implement test
    });
  });

  describe('addConfigAccount()', () => {
    it('adds valid account to config', () => {
      // TODO: Implement test
    });

    it('throws for invalid account', () => {
      // TODO: Implement test
    });

    it('throws when account already exists', () => {
      // TODO: Implement test
    });
  });

  describe('updateConfigAccount()', () => {
    it('updates existing account', () => {
      // TODO: Implement test
    });

    it('throws for invalid account', () => {
      // TODO: Implement test
    });

    it('throws when account not found', () => {
      // TODO: Implement test
    });
  });

  describe('setConfigAccountAsDefault()', () => {
    it('sets account as default by id', () => {
      // TODO: Implement test
    });

    it('sets account as default by name', () => {
      // TODO: Implement test
    });

    it('throws when account not found', () => {
      // TODO: Implement test
    });
  });

  describe('renameConfigAccount()', () => {
    it('renames existing account', () => {
      // TODO: Implement test
    });

    it('throws when account not found', () => {
      // TODO: Implement test
    });

    it('throws when new name already exists', () => {
      // TODO: Implement test
    });
  });

  describe('removeAccountFromConfig()', () => {
    it('removes existing account', () => {
      // TODO: Implement test
    });

    it('throws when account not found', () => {
      // TODO: Implement test
    });
  });

  describe('updateHttpTimeout()', () => {
    it('updates timeout value', () => {
      // TODO: Implement test
    });

    it('throws for invalid timeout', () => {
      // TODO: Implement test
    });
  });

  describe('updateAllowUsageTracking()', () => {
    it('updates tracking setting', () => {
      // TODO: Implement test
    });
  });

  describe('updateDefaultCmsPublishMode()', () => {
    it('updates publish mode', () => {
      // TODO: Implement test
    });

    it('throws for invalid mode', () => {
      // TODO: Implement test
    });
  });

  describe('isConfigFlagEnabled()', () => {
    it('returns flag value when set', () => {
      // TODO: Implement test
    });

    it('returns default value when not set', () => {
      // TODO: Implement test
    });
  });
});
