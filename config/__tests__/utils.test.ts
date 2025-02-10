import findup from 'findup-sync';
import fs from 'fs-extra';
import {
  getGlobalConfigFilePath,
  getLocalConfigFilePath,
  getLocalConfigFileDefaultPath,
  getConfigPathEnvironmentVariables,
  readConfigFile,
  removeUndefinedFieldsFromConfigAccount,
  writeConfigFile,
  normalizeParsedConfig,
  buildConfigFromEnvironment,
  getConfigAccountByIdentifier,
  getConfigAccountIndexById,
  isConfigAccountValid,
  getAccountIdentifierAndType,
} from '../utils';
import { getCwd } from '../../lib/path';
import {
  DeprecatedHubSpotConfigAccountFields,
  HubSpotConfigAccount,
  PersonalAccessKeyConfigAccount,
  OAuthConfigAccount,
  APIKeyConfigAccount,
} from '../../types/Accounts';
import {
  DeprecatedHubSpotConfigFields,
  HubSpotConfig,
} from '../../types/Config';
import { ENVIRONMENT_VARIABLES } from '../../constants/config';
import { FileSystemError } from '../../models/FileSystemError';
import {
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  API_KEY_AUTH_METHOD,
} from '../../constants/auth';

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

const DEPRECATED_ACCOUNT: HubSpotConfigAccount &
  DeprecatedHubSpotConfigAccountFields = {
  name: 'test-account',
  portalId: 123,
  accountId: 1,
  authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
  personalAccessKey: 'test-key',
  env: 'qa',
  auth: {
    tokenInfo: {},
  },
  accountType: undefined,
};

const CONFIG: HubSpotConfig = {
  defaultAccount: PAK_ACCOUNT.accountId,
  accounts: [PAK_ACCOUNT],
  defaultCmsPublishMode: 'publish',
  httpTimeout: 1000,
  httpUseLocalhost: true,
  allowUsageTracking: true,
};

const DEPRECATED_CONFIG: HubSpotConfig & DeprecatedHubSpotConfigFields = {
  accounts: [],
  defaultAccount: 1,
  portals: [DEPRECATED_ACCOUNT],
  defaultPortal: DEPRECATED_ACCOUNT.name,
  defaultCmsPublishMode: undefined,
  defaultMode: 'publish',
  httpTimeout: 1000,
  httpUseLocalhost: true,
  allowUsageTracking: true,
};

function cleanupEnvironmentVariables() {
  Object.keys(ENVIRONMENT_VARIABLES).forEach(key => {
    delete process.env[key];
  });
}

describe('config/utils', () => {
  beforeEach(() => {
    cleanupEnvironmentVariables();
  });

  afterEach(() => {
    cleanupEnvironmentVariables();
  });

  describe('getGlobalConfigFilePath()', () => {
    it('returns the global config file path', () => {
      const globalConfigFilePath = getGlobalConfigFilePath();
      expect(globalConfigFilePath).toBeDefined();
      expect(globalConfigFilePath).toContain('.hubspot-cli/config.yml');
    });
  });

  describe('getLocalConfigFilePath()', () => {
    it('returns the nearest config file path', () => {
      const mockConfigPath = '/mock/path/hubspot.config.yml';
      mockFindup.mockReturnValue(mockConfigPath);

      const localConfigPath = getLocalConfigFilePath();
      expect(localConfigPath).toBe(mockConfigPath);
    });

    it('returns null if no config file found', () => {
      mockFindup.mockReturnValue(null);
      const localConfigPath = getLocalConfigFilePath();
      expect(localConfigPath).toBeNull();
    });
  });

  describe('getLocalConfigFileDefaultPath()', () => {
    it('returns the default config path in current directory', () => {
      const mockCwdPath = '/mock/cwd';
      mockCwd.mockReturnValue(mockCwdPath);

      const defaultPath = getLocalConfigFileDefaultPath();
      expect(defaultPath).toBe(`${mockCwdPath}/hubspot.config.yml`);
    });
  });

  describe('getConfigPathEnvironmentVariables()', () => {
    it('returns environment config settings', () => {
      const configPath = 'config/path';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_CONFIG_PATH] = configPath;

      const result = getConfigPathEnvironmentVariables();
      expect(result.useEnvironmentConfig).toBe(false);
      expect(result.configFilePathFromEnvironment).toBe(configPath);
    });

    it('throws when both environment variables are set', () => {
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_CONFIG_PATH] = 'path';
      process.env[ENVIRONMENT_VARIABLES.USE_ENVIRONMENT_CONFIG] = 'true';

      expect(() => getConfigPathEnvironmentVariables()).toThrow();
    });
  });

  describe('readConfigFile()', () => {
    it('reads and returns file contents', () => {
      mockFs.readFileSync.mockReturnValue('config contents');
      const result = readConfigFile('test');
      expect(result).toBe('config contents');
    });

    it('throws FileSystemError on read failure', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      expect(() => readConfigFile('test')).toThrow(FileSystemError);
    });
  });

  describe('removeUndefinedFieldsFromConfigAccount()', () => {
    it('removes undefined fields from account', () => {
      const accountWithUndefinedFields = {
        ...PAK_ACCOUNT,
        defaultCmsPublishMode: undefined,
        auth: {
          ...PAK_ACCOUNT.auth,
          tokenInfo: {
            refreshToken: undefined,
          },
        },
      };

      const withFieldsRemoved = removeUndefinedFieldsFromConfigAccount(
        accountWithUndefinedFields
      );

      expect(withFieldsRemoved).toEqual(PAK_ACCOUNT);
    });
  });

  describe('writeConfigFile()', () => {
    it('writes formatted config to file', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      mockFs.ensureFileSync.mockImplementation(() => {});
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      mockFs.writeFileSync.mockImplementation(() => {});

      writeConfigFile(CONFIG, 'test.yml');

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('throws FileSystemError on write failure', () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      expect(() => writeConfigFile(CONFIG, 'test.yml')).toThrow(
        FileSystemError
      );
    });
  });

  describe('normalizeParsedConfig()', () => {
    it('converts portal fields to account fields', () => {
      const normalizedConfig = normalizeParsedConfig(DEPRECATED_CONFIG);
      expect(normalizedConfig).toEqual(CONFIG);
    });
  });

  describe('buildConfigFromEnvironment()', () => {
    it('builds personal access key config', () => {
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_PERSONAL_ACCESS_KEY] =
        'test-key';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ACCOUNT_ID] = '123';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT] = 'qa';
      process.env[ENVIRONMENT_VARIABLES.HTTP_TIMEOUT] = '1000';
      process.env[ENVIRONMENT_VARIABLES.HTTP_USE_LOCALHOST] = 'true';
      process.env[ENVIRONMENT_VARIABLES.ALLOW_USAGE_TRACKING] = 'true';
      process.env[ENVIRONMENT_VARIABLES.DEFAULT_CMS_PUBLISH_MODE] = 'publish';

      const config = buildConfigFromEnvironment();

      expect(config).toEqual({
        ...CONFIG,
        accounts: [{ ...PAK_ACCOUNT, name: '123', accountType: undefined }],
      });
    });

    it('builds OAuth config', () => {
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_ID] = 'test-client-id';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_SECRET] =
        'test-client-secret';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_REFRESH_TOKEN] =
        'test-refresh-token';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ACCOUNT_ID] = '123';
      process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT] = 'qa';
      process.env[ENVIRONMENT_VARIABLES.HTTP_TIMEOUT] = '1000';
      process.env[ENVIRONMENT_VARIABLES.HTTP_USE_LOCALHOST] = 'true';
      process.env[ENVIRONMENT_VARIABLES.ALLOW_USAGE_TRACKING] = 'true';
      process.env[ENVIRONMENT_VARIABLES.DEFAULT_CMS_PUBLISH_MODE] = 'publish';

      const config = buildConfigFromEnvironment();

      expect(config).toEqual({
        ...CONFIG,
        accounts: [OAUTH_ACCOUNT],
      });
    });

    it('throws when required variables missing', () => {
      expect(() => {
        process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ACCOUNT_ID] = '123';
        process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT] = 'qa';
        buildConfigFromEnvironment();
      }).toThrow();
    });
  });

  describe('getConfigAccountByIdentifier()', () => {
    it('finds account by name', () => {
      const account = getConfigAccountByIdentifier(
        CONFIG.accounts,
        'name',
        'test-account'
      );

      expect(account).toEqual(PAK_ACCOUNT);
    });

    it('finds account by accountId', () => {
      const account = getConfigAccountByIdentifier(
        CONFIG.accounts,
        'accountId',
        123
      );

      expect(account).toEqual(PAK_ACCOUNT);
    });

    it('returns undefined when account not found', () => {
      const account = getConfigAccountByIdentifier(
        CONFIG.accounts,
        'accountId',
        1234
      );

      expect(account).toBeUndefined();
    });
  });

  describe('getConfigAccountIndexById()', () => {
    it('returns correct index for existing account', () => {
      const index = getConfigAccountIndexById(CONFIG.accounts, 123);
      expect(index).toBe(0);
    });

    it('returns -1 when account not found', () => {
      const index = getConfigAccountIndexById(CONFIG.accounts, 1234);
      expect(index).toBe(-1);
    });
  });

  describe('isConfigAccountValid()', () => {
    it('validates personal access key account', () => {
      expect(isConfigAccountValid(PAK_ACCOUNT)).toBe(true);
    });

    it('validates OAuth account', () => {
      expect(isConfigAccountValid(OAUTH_ACCOUNT)).toBe(true);
    });

    it('validates API key account', () => {
      expect(isConfigAccountValid(API_KEY_ACCOUNT)).toBe(true);
    });

    it('returns false for invalid account', () => {
      expect(
        isConfigAccountValid({
          ...PAK_ACCOUNT,
          personalAccessKey: undefined,
        })
      ).toBe(false);
      expect(
        isConfigAccountValid({
          ...PAK_ACCOUNT,
          accountId: undefined,
        })
      ).toBe(false);
    });
  });

  describe('getAccountIdentifierAndType()', () => {
    it('returns name identifier for string', () => {
      const { identifier, identifierType } =
        getAccountIdentifierAndType('test-account');
      expect(identifier).toBe('test-account');
      expect(identifierType).toBe('name');
    });

    it('returns accountId identifier for number', () => {
      const { identifier, identifierType } = getAccountIdentifierAndType(123);
      expect(identifier).toBe(123);
      expect(identifierType).toBe('accountId');
    });

    it('returns accountId identifier for numeric string', () => {
      const { identifier, identifierType } = getAccountIdentifierAndType('123');
      expect(identifier).toBe(123);
      expect(identifierType).toBe('accountId');
    });
  });
});
