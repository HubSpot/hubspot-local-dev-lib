import fs from 'fs-extra';
import {
  getLocalConfigDefaultFilePath,
  getConfigPathEnvironmentVariables,
  doesConfigFileExistAtPath,
  readConfigFile,
  removeUndefinedFieldsFromConfigAccount,
  formatConfigForWrite,
  writeConfigFile,
  parseConfig,
  normalizeParsedConfig,
  convertToDeprecatedConfig,
  buildConfigFromEnvironment,
  getAccountIdentifierAndType,
  getConfigAccountByIdentifier,
  getConfigAccountByInferredIdentifier,
  getConfigAccountIndexById,
  validateConfigAccount,
  handleConfigFileSystemError,
} from '../utils';
import { HubSpotConfigError } from '../../models/HubSpotConfigError';
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
import { i18n } from '../../utils/lang';

jest.mock('findup-sync');
jest.mock('../../lib/path');
jest.mock('fs-extra');

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

  describe('getLocalConfigDefaultFilePath()', () => {
    it('returns the default config path in current directory', () => {
      const mockCwdPath = '/mock/cwd';
      mockCwd.mockReturnValue(mockCwdPath);

      const defaultPath = getLocalConfigDefaultFilePath();
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
      process.env[ENVIRONMENT_VARIABLES.USE_ENVIRONMENT_HUBSPOT_CONFIG] =
        'true';

      expect(() => getConfigPathEnvironmentVariables()).toThrow();
    });
  });

  describe('readConfigFile()', () => {
    it('reads and returns file contents', () => {
      mockFs.readFileSync.mockReturnValue('config contents');
      const result = readConfigFile('test');
      expect(result).toBe('config contents');
    });

    it('throws HubSpotConfigError on read failure', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      expect(() => readConfigFile('test')).toThrow(HubSpotConfigError);
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
      mockFs.ensureFileSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

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

  describe('convertToDeprecatedConfig()', () => {
    it('converts account fields to portal fields', () => {
      const deprecated = convertToDeprecatedConfig(CONFIG);

      expect(deprecated.portals).toBeDefined();
      expect(deprecated.accounts).toBeUndefined();
      expect(deprecated.portals).toHaveLength(1);
      expect(deprecated.portals![0]).toHaveProperty('portalId', 123);
      expect(deprecated.portals![0]).not.toHaveProperty('accountId');
    });

    it('converts defaultAccount to defaultPortal', () => {
      const deprecated = convertToDeprecatedConfig(CONFIG);

      expect(deprecated.defaultPortal).toBe('test-account');
      expect(deprecated.defaultAccount).toBeUndefined();
    });

    it('preserves personal access key account fields', () => {
      const deprecated = convertToDeprecatedConfig(CONFIG);

      expect(deprecated.portals![0]).toMatchObject({
        name: 'test-account',
        portalId: 123,
        authType: 'personalaccesskey',
        personalAccessKey: 'test-key',
        env: 'qa',
      });
    });

    it('preserves OAuth account fields', () => {
      const oauthConfig = {
        ...CONFIG,
        accounts: [OAUTH_ACCOUNT],
        defaultAccount: 123,
      };
      const deprecated = convertToDeprecatedConfig(oauthConfig);

      expect(deprecated.portals![0]).toMatchObject({
        name: '123',
        portalId: 123,
        authType: 'oauth2',
        auth: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tokenInfo: {
            refreshToken: 'test-refresh-token',
          },
          scopes: ['content', 'hubdb', 'files'],
        },
      });
    });

    it('preserves API key account fields', () => {
      const apiKeyConfig = {
        ...CONFIG,
        accounts: [API_KEY_ACCOUNT],
        defaultAccount: 123,
      };
      const deprecated = convertToDeprecatedConfig(apiKeyConfig);

      expect(deprecated.portals![0]).toMatchObject({
        name: '123',
        portalId: 123,
        authType: 'apikey',
        apiKey: 'test-api-key',
      });
    });

    it('handles multiple accounts', () => {
      const multiAccountConfig = {
        ...CONFIG,
        accounts: [PAK_ACCOUNT, OAUTH_ACCOUNT, API_KEY_ACCOUNT],
        defaultAccount: 123,
      };
      const deprecated = convertToDeprecatedConfig(multiAccountConfig);

      expect(deprecated.portals).toHaveLength(3);
      expect(deprecated.portals![0].portalId).toBe(123);
      expect(deprecated.portals![1].portalId).toBe(123);
      expect(deprecated.portals![2].portalId).toBe(123);
    });

    it('handles config without defaultAccount', () => {
      const configWithoutDefault = {
        ...CONFIG,
        defaultAccount: undefined,
      };
      const deprecated = convertToDeprecatedConfig(configWithoutDefault);

      expect(deprecated.defaultPortal).toBeUndefined();
      expect(deprecated.defaultAccount).toBeUndefined();
    });

    it('preserves all other config fields', () => {
      const deprecated = convertToDeprecatedConfig(CONFIG);

      expect(deprecated.defaultCmsPublishMode).toBe('publish');
      expect(deprecated.httpTimeout).toBe(1000);
      expect(deprecated.httpUseLocalhost).toBe(true);
      expect(deprecated.allowUsageTracking).toBe(true);
    });

    it('does not mutate the original config', () => {
      const testConfig = structuredClone(CONFIG);

      convertToDeprecatedConfig(testConfig);

      // Verify original structure is preserved
      expect(testConfig.accounts).toBeDefined();
      expect(testConfig.accounts).toHaveLength(1);
      expect(testConfig.accounts[0]).toHaveProperty('accountId', 123);
      expect(testConfig.defaultAccount).toBe(123);

      // Verify deprecated fields were not added to original
      expect(testConfig).not.toHaveProperty('portals');
      expect(testConfig).not.toHaveProperty('defaultPortal');
      expect(testConfig.accounts[0]).not.toHaveProperty('portalId');
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

  describe('validateConfigAccount()', () => {
    it('validates personal access key account', () => {
      expect(validateConfigAccount(PAK_ACCOUNT)).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('validates OAuth account', () => {
      expect(validateConfigAccount(OAUTH_ACCOUNT)).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('validates API key account', () => {
      expect(validateConfigAccount(API_KEY_ACCOUNT)).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('returns false for invalid account', () => {
      expect(
        validateConfigAccount({
          ...PAK_ACCOUNT,
          personalAccessKey: undefined,
        })
      ).toEqual({
        isValid: false,
        errors: [
          i18n('config.utils.validateConfigAccount.missingPersonalAccessKey', {
            accountId: PAK_ACCOUNT.accountId,
          }),
        ],
      });
      expect(
        validateConfigAccount({
          ...PAK_ACCOUNT,
          accountId: undefined,
        })
      ).toEqual({
        isValid: false,
        errors: [i18n('config.utils.validateConfigAccount.missingAccountId')],
      });
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

  describe('doesConfigFileExistAtPath()', () => {
    it('returns true when file exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      expect(doesConfigFileExistAtPath('/path/to/config.yml')).toBe(true);
    });

    it('returns false when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(doesConfigFileExistAtPath('/path/to/config.yml')).toBe(false);
    });

    it('throws HubSpotConfigError on error', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      expect(() => doesConfigFileExistAtPath('/path/to/config.yml')).toThrow(
        HubSpotConfigError
      );
    });
  });

  describe('formatConfigForWrite()', () => {
    it('formats config with consistent field order', () => {
      const formattedConfig = formatConfigForWrite(CONFIG);
      const keys = Object.keys(formattedConfig);
      expect(keys[0]).toBe('defaultAccount');
      expect(keys[keys.length - 1]).toBe('accounts');
    });

    it('removes undefined fields from accounts', () => {
      const configWithUndefined = {
        ...CONFIG,
        accounts: [
          {
            ...PAK_ACCOUNT,
            someUndefinedField: undefined,
          },
        ],
      };
      const formattedConfig = formatConfigForWrite(configWithUndefined);
      expect(formattedConfig.accounts[0]).not.toHaveProperty(
        'someUndefinedField'
      );
    });

    it('preserves all account types', () => {
      const multiAccountConfig = {
        ...CONFIG,
        accounts: [PAK_ACCOUNT, OAUTH_ACCOUNT, API_KEY_ACCOUNT],
      };
      const formatted = formatConfigForWrite(multiAccountConfig);
      expect(formatted.accounts).toHaveLength(3);
      expect(formatted.accounts[0].authType).toBe('personalaccesskey');
      expect(formatted.accounts[1].authType).toBe('oauth2');
      expect(formatted.accounts[2].authType).toBe('apikey');
    });
  });

  describe('parseConfig()', () => {
    it('parses valid YAML config', () => {
      const yamlConfig = `
accounts:
  - name: test-account
    accountId: 123
    authType: personalaccesskey
    personalAccessKey: test-key
    env: qa
    auth:
      tokenInfo: {}
    accountType: STANDARD
defaultAccount: 123
defaultCmsPublishMode: publish
httpTimeout: 1000
httpUseLocalhost: true
allowUsageTracking: true
`;
      const parsed = parseConfig(yamlConfig, '/path/to/config.yml');
      expect(parsed).toEqual(CONFIG);
    });

    it('throws HubSpotConfigError on invalid YAML', () => {
      const invalidYaml = 'invalid: yaml: content: [';
      expect(() => parseConfig(invalidYaml, '/path/to/config.yml')).toThrow(
        HubSpotConfigError
      );
    });

    it('normalizes deprecated config format', () => {
      const deprecatedYaml = `
portals:
  - name: test-account
    portalId: 123
    authType: personalaccesskey
    personalAccessKey: test-key
    env: qa
    auth:
      tokenInfo: {}
defaultPortal: test-account
defaultMode: publish
httpTimeout: 1000
httpUseLocalhost: true
allowUsageTracking: true
`;
      const parsed = parseConfig(deprecatedYaml, '/path/to/config.yml');
      expect(parsed).toEqual(CONFIG);
    });
  });

  describe('getConfigAccountByInferredIdentifier()', () => {
    it('finds account by numeric accountId', () => {
      const account = getConfigAccountByInferredIdentifier(
        CONFIG.accounts,
        123
      );
      expect(account).toEqual(PAK_ACCOUNT);
    });

    it('finds account by string accountId', () => {
      const account = getConfigAccountByInferredIdentifier(
        CONFIG.accounts,
        '123'
      );
      expect(account).toEqual(PAK_ACCOUNT);
    });

    it('finds account by name', () => {
      const account = getConfigAccountByInferredIdentifier(
        CONFIG.accounts,
        'test-account'
      );
      expect(account).toEqual(PAK_ACCOUNT);
    });

    it('handles accounts with numeric names as fallback', () => {
      const accountWithNumericName = {
        ...PAK_ACCOUNT,
        name: '456',
        accountId: 789,
      };
      const accounts = [accountWithNumericName];
      const account = getConfigAccountByInferredIdentifier(accounts, '456');
      expect(account).toEqual(accountWithNumericName);
    });

    it('returns undefined when account not found', () => {
      const account = getConfigAccountByInferredIdentifier(
        CONFIG.accounts,
        999
      );
      expect(account).toBeUndefined();
    });
  });

  describe('handleConfigFileSystemError()', () => {
    it('handles ENOENT error', () => {
      const error = Object.assign(new Error('File not found'), {
        code: 'ENOENT',
      });
      const { message, type } = handleConfigFileSystemError(
        error,
        '/path/to/config.yml'
      );
      expect(message).toContain('No config file found');
      expect(type).toBe('CONFIG_NOT_FOUND');
    });

    it('handles EACCES error', () => {
      const error = Object.assign(new Error('Permission denied'), {
        code: 'EACCES',
      });
      const { message, type } = handleConfigFileSystemError(
        error,
        '/path/to/config.yml'
      );
      expect(message).toContain('Insufficient permissions');
      expect(type).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('handles unknown errors', () => {
      const error = new Error('Unknown error');
      const { message, type } = handleConfigFileSystemError(
        error,
        '/path/to/config.yml'
      );
      expect(message).toBeUndefined();
      expect(type).toBe('UNKNOWN');
    });
  });
});
