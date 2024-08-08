import fs from 'fs-extra';
import {
  setConfig,
  getAndLoadConfigIfNeeded,
  getConfig,
  getAccountType,
  getConfigPath,
  getAccountConfig,
  getAccountId,
  updateDefaultAccount,
  updateAccountConfig,
  validateConfig,
  deleteEmptyConfigFile,
  setConfigPath,
  createEmptyConfigFile,
  getRootOrDeprecatedConfigPath,
  bothConfigFilesExist,
} from '../index';
import {
  getAccountIdentifier,
  getAccounts,
  getDefaultAccount,
} from '../../utils/getAccountIdentifier';
import { ENVIRONMENTS } from '../../constants/environments';
import { HUBSPOT_ACCOUNT_TYPES } from '../../constants/config';
import { CLIConfig, CLIConfig_DEPRECATED } from '../../types/Config';
import {
  APIKeyAccount_DEPRECATED,
  AuthType,
  CLIAccount,
  OAuthAccount,
  OAuthAccount_DEPRECATED,
  APIKeyAccount,
  PersonalAccessKeyAccount,
  PersonalAccessKeyAccount_DEPRECATED,
} from '../../types/Accounts';
import * as configFile from '../configFile';
//import * as config_DEPRECATED from '../config_DEPRECATED';

const CONFIG_PATHS = {
  none: null,
  default: '/Users/fakeuser/hubspot.config.yml',
  nonStandard: '/Some/non-standard.config.yml',
  cwd: `${process.cwd()}/hubspot.config.yml`,
};

let mockedConfigPath: string | null = CONFIG_PATHS.default;

jest.mock('findup-sync', () => {
  return jest.fn(() => mockedConfigPath);
});

jest.mock('../../lib/logger');

jest.mock('../configFile');
//jest.mock('../config_DEPRECATED')

const fsReadFileSyncSpy = jest.spyOn(fs, 'readFileSync');
const fsWriteFileSyncSpy = jest.spyOn(fs, 'writeFileSync');

const API_KEY_CONFIG: APIKeyAccount_DEPRECATED = {
  portalId: 1111,
  name: 'API',
  authType: 'apikey',
  apiKey: 'secret',
  env: ENVIRONMENTS.QA,
};

const OAUTH2_CONFIG: OAuthAccount_DEPRECATED = {
  name: 'OAUTH2',
  portalId: 2222,
  authType: 'oauth2',
  auth: {
    clientId: 'fakeClientId',
    clientSecret: 'fakeClientSecret',
    scopes: ['content'],
    tokenInfo: {
      expiresAt: '2020-01-01T00:00:00.000Z',
      refreshToken: 'fakeOauthRefreshToken',
      accessToken: 'fakeOauthAccessToken',
    },
  },
  env: ENVIRONMENTS.QA,
};

const PERSONAL_ACCESS_KEY_CONFIG: PersonalAccessKeyAccount_DEPRECATED = {
  name: 'PERSONALACCESSKEY',
  authType: 'personalaccesskey',
  auth: {
    tokenInfo: {
      expiresAt: '2020-01-01T00:00:00.000Z',
      accessToken: 'fakePersonalAccessKeyAccessToken',
    },
  },
  personalAccessKey: 'fakePersonalAccessKey',
  env: ENVIRONMENTS.QA,
  portalId: 1,
};

const PORTALS = [API_KEY_CONFIG, OAUTH2_CONFIG, PERSONAL_ACCESS_KEY_CONFIG];

const CONFIG: CLIConfig_DEPRECATED = {
  defaultPortal: PORTALS[0].name,
  portals: PORTALS,
};

function getAccountByAuthType(
  config: CLIConfig | undefined | null,
  authType: AuthType
): CLIAccount {
  return getAccounts(config).filter(portal => portal.authType === authType)[0];
}

describe('config/config', () => {
  const globalConsole = global.console;
  beforeAll(() => {
    global.console.error = jest.fn();
    global.console.debug = jest.fn();
  });
  afterAll(() => {
    global.console = globalConsole;
  });

  describe('setConfig()', () => {
    beforeEach(() => {
      setConfig(CONFIG);
    });

    it('sets the config properly', () => {
      expect(getConfig()).toEqual(CONFIG);
    });
  });

  describe('getAccountId()', () => {
    beforeEach(() => {
      process.env = {};
      setConfig({
        defaultPortal: PERSONAL_ACCESS_KEY_CONFIG.name,
        portals: PORTALS,
      });
    });

    it('returns portalId from config when a name is passed', () => {
      expect(getAccountId(OAUTH2_CONFIG.name)).toEqual(OAUTH2_CONFIG.portalId);
    });

    it('returns portalId from config when a string id is passed', () => {
      expect(getAccountId((OAUTH2_CONFIG.portalId || '').toString())).toEqual(
        OAUTH2_CONFIG.portalId
      );
    });

    it('returns portalId from config when a numeric id is passed', () => {
      expect(getAccountId(OAUTH2_CONFIG.portalId)).toEqual(
        OAUTH2_CONFIG.portalId
      );
    });

    it('returns defaultPortal from config', () => {
      expect(getAccountId() || undefined).toEqual(
        PERSONAL_ACCESS_KEY_CONFIG.portalId
      );
    });

    describe('when defaultPortal is a portalId', () => {
      beforeEach(() => {
        process.env = {};
        setConfig({
          defaultPortal: PERSONAL_ACCESS_KEY_CONFIG.portalId,
          portals: PORTALS,
        });
      });

      it('returns defaultPortal from config', () => {
        expect(getAccountId() || undefined).toEqual(
          PERSONAL_ACCESS_KEY_CONFIG.portalId
        );
      });
    });
  });

  describe('updateDefaultAccount()', () => {
    const myPortalName = 'Foo';

    beforeEach(() => {
      updateDefaultAccount(myPortalName);
    });

    it('sets the defaultPortal in the config', () => {
      const config = getConfig();
      expect(config ? getDefaultAccount(config) : null).toEqual(myPortalName);
    });
  });

  describe('deleteEmptyConfigFile()', () => {
    it('does not delete config file if there are contents', () => {
      jest
        .spyOn(fs, 'readFileSync')
        .mockImplementation(() => 'defaultPortal: "test"');
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
      fs.unlinkSync = jest.fn();

      deleteEmptyConfigFile();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('deletes config file if empty', () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => '');
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
      fs.unlinkSync = jest.fn();

      deleteEmptyConfigFile();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('updateAccountConfig()', () => {
    const CONFIG = {
      defaultPortal: PORTALS[0].name,
      portals: PORTALS,
    };

    beforeEach(() => {
      setConfig(CONFIG);
    });

    it('sets the env in the config if specified', () => {
      const environment = ENVIRONMENTS.QA;
      const modifiedPersonalAccessKeyConfig = {
        ...PERSONAL_ACCESS_KEY_CONFIG,
        environment,
      };
      updateAccountConfig(modifiedPersonalAccessKeyConfig);

      expect(
        getAccountByAuthType(
          getConfig(),
          modifiedPersonalAccessKeyConfig.authType
        ).env
      ).toEqual(environment);
    });

    it('sets the env in the config if it was preexisting', () => {
      const env = ENVIRONMENTS.QA;
      setConfig({
        defaultPortal: PERSONAL_ACCESS_KEY_CONFIG.name,
        portals: [{ ...PERSONAL_ACCESS_KEY_CONFIG, env }],
      });
      const modifiedPersonalAccessKeyConfig = {
        ...PERSONAL_ACCESS_KEY_CONFIG,
        env: undefined,
      };

      updateAccountConfig(modifiedPersonalAccessKeyConfig);

      expect(
        getAccountByAuthType(
          getConfig(),
          modifiedPersonalAccessKeyConfig.authType
        ).env
      ).toEqual(env);
    });

    it('overwrites the existing env in the config if specified as environment', () => {
      // NOTE: the config now uses "env", but this is to support legacy behavior
      const previousEnv = ENVIRONMENTS.PROD;
      const newEnv = ENVIRONMENTS.QA;
      setConfig({
        defaultPortal: PERSONAL_ACCESS_KEY_CONFIG.name,
        portals: [{ ...PERSONAL_ACCESS_KEY_CONFIG, env: previousEnv }],
      });
      const modifiedPersonalAccessKeyConfig = {
        ...PERSONAL_ACCESS_KEY_CONFIG,
        environment: newEnv,
      };
      updateAccountConfig(modifiedPersonalAccessKeyConfig);

      expect(
        getAccountByAuthType(
          getConfig(),
          modifiedPersonalAccessKeyConfig.authType
        ).env
      ).toEqual(newEnv);
    });

    it('overwrites the existing env in the config if specified as env', () => {
      const previousEnv = ENVIRONMENTS.PROD;
      const newEnv = ENVIRONMENTS.QA;
      setConfig({
        defaultPortal: PERSONAL_ACCESS_KEY_CONFIG.name,
        portals: [{ ...PERSONAL_ACCESS_KEY_CONFIG, env: previousEnv }],
      });
      const modifiedPersonalAccessKeyConfig = {
        ...PERSONAL_ACCESS_KEY_CONFIG,
        env: newEnv,
      };
      updateAccountConfig(modifiedPersonalAccessKeyConfig);

      expect(
        getAccountByAuthType(
          getConfig(),
          modifiedPersonalAccessKeyConfig.authType
        ).env
      ).toEqual(newEnv);
    });

    it('sets the name in the config if specified', () => {
      const name = 'MYNAME';
      const modifiedPersonalAccessKeyConfig = {
        ...PERSONAL_ACCESS_KEY_CONFIG,
        name,
      };
      updateAccountConfig(modifiedPersonalAccessKeyConfig);

      expect(
        getAccountByAuthType(
          getConfig(),
          modifiedPersonalAccessKeyConfig.authType
        ).name
      ).toEqual(name);
    });

    it('sets the name in the config if it was preexisting', () => {
      const name = 'PREEXISTING';
      setConfig({
        defaultPortal: PERSONAL_ACCESS_KEY_CONFIG.name,
        portals: [{ ...PERSONAL_ACCESS_KEY_CONFIG, name }],
      });
      const modifiedPersonalAccessKeyConfig = {
        ...PERSONAL_ACCESS_KEY_CONFIG,
      };
      delete modifiedPersonalAccessKeyConfig.name;
      updateAccountConfig(modifiedPersonalAccessKeyConfig);

      expect(
        getAccountByAuthType(
          getConfig(),
          modifiedPersonalAccessKeyConfig.authType
        ).name
      ).toEqual(name);
    });

    it('overwrites the existing name in the config if specified', () => {
      const previousName = 'PREVIOUSNAME';
      const newName = 'NEWNAME';
      setConfig({
        defaultPortal: PERSONAL_ACCESS_KEY_CONFIG.name,
        portals: [{ ...PERSONAL_ACCESS_KEY_CONFIG, name: previousName }],
      });
      const modifiedPersonalAccessKeyConfig = {
        ...PERSONAL_ACCESS_KEY_CONFIG,
        name: newName,
      };
      updateAccountConfig(modifiedPersonalAccessKeyConfig);

      expect(
        getAccountByAuthType(
          getConfig(),
          modifiedPersonalAccessKeyConfig.authType
        ).name
      ).toEqual(newName);
    });
  });

  describe('validateConfig()', () => {
    const DEFAULT_PORTAL = PORTALS[0].name;

    it('allows valid config', () => {
      setConfig({
        defaultPortal: DEFAULT_PORTAL,
        portals: PORTALS,
      });
      expect(validateConfig()).toEqual(true);
    });

    it('does not allow duplicate portalIds', () => {
      setConfig({
        defaultPortal: DEFAULT_PORTAL,
        portals: [...PORTALS, PORTALS[0]],
      });
      expect(validateConfig()).toEqual(false);
    });

    it('does not allow duplicate names', () => {
      setConfig({
        defaultPortal: DEFAULT_PORTAL,
        portals: [
          ...PORTALS,
          {
            ...PORTALS[0],
            portalId: 123456789,
          },
        ],
      });
      expect(validateConfig()).toEqual(false);
    });

    it('does not allow names with spaces', () => {
      setConfig({
        defaultPortal: DEFAULT_PORTAL,
        portals: [
          {
            ...PORTALS[0],
            name: 'A NAME WITH SPACES',
          },
        ],
      });
      expect(validateConfig()).toEqual(false);
    });

    it('allows multiple portals with no name', () => {
      setConfig({
        defaultPortal: DEFAULT_PORTAL,
        portals: [
          {
            ...PORTALS[0],
            name: undefined,
          },
          {
            ...PORTALS[1],
            name: undefined,
          },
        ],
      });
      expect(validateConfig()).toEqual(true);
    });
  });

  describe('getAndLoadConfigIfNeeded()', () => {
    beforeEach(() => {
      setConfig(undefined);
      process.env = {};
    });

    it('loads a config from file if no combination of environment variables is sufficient', () => {
      const readFileSyncSpy = jest.spyOn(fs, 'readFileSync');

      getAndLoadConfigIfNeeded();
      expect(fs.readFileSync).toHaveBeenCalled();
      readFileSyncSpy.mockReset();
    });

    describe('oauth environment variable config', () => {
      const {
        portalId,
        auth: { clientId, clientSecret },
      } = OAUTH2_CONFIG;
      const refreshToken = OAUTH2_CONFIG.auth.tokenInfo?.refreshToken || '';
      let portalConfig: OAuthAccount | null;

      beforeEach(() => {
        process.env = {
          HUBSPOT_PORTAL_ID: `${portalId}`,
          HUBSPOT_CLIENT_ID: clientId,
          HUBSPOT_CLIENT_SECRET: clientSecret,
          HUBSPOT_REFRESH_TOKEN: refreshToken,
        };
        getAndLoadConfigIfNeeded({ useEnv: true });
        portalConfig = getAccountConfig(portalId) as OAuthAccount;
        fsReadFileSyncSpy.mockReset();
      });

      afterEach(() => {
        // Clean up environment variable config so subsequent tests don't break
        process.env = {};
        setConfig(undefined);
        getAndLoadConfigIfNeeded();
      });

      it('does not load a config from file', () => {
        expect(fsReadFileSyncSpy).not.toHaveBeenCalled();
      });

      it('creates a portal config', () => {
        expect(portalConfig).toBeTruthy();
      });

      it('properly loads portal id value', () => {
        expect(getAccountIdentifier(portalConfig)).toEqual(portalId);
      });

      it('properly loads client id value', () => {
        expect(portalConfig?.auth.clientId).toEqual(clientId);
      });

      it('properly loads client secret value', () => {
        expect(portalConfig?.auth.clientSecret).toEqual(clientSecret);
      });

      it('properly loads refresh token value', () => {
        expect(portalConfig?.auth?.tokenInfo?.refreshToken).toEqual(
          refreshToken
        );
      });
    });

    describe('apikey environment variable config', () => {
      const { portalId, apiKey } = API_KEY_CONFIG;
      let portalConfig: APIKeyAccount;

      beforeEach(() => {
        process.env = {
          HUBSPOT_PORTAL_ID: `${portalId}`,
          HUBSPOT_API_KEY: apiKey,
        };
        getAndLoadConfigIfNeeded({ useEnv: true });
        portalConfig = getAccountConfig(portalId) as APIKeyAccount;
        fsReadFileSyncSpy.mockReset();
      });

      afterEach(() => {
        // Clean up environment variable config so subsequent tests don't break
        process.env = {};
        setConfig(undefined);
        getAndLoadConfigIfNeeded();
      });

      it('does not load a config from file', () => {
        expect(fsReadFileSyncSpy).not.toHaveBeenCalled();
      });

      it('creates a portal config', () => {
        expect(portalConfig).toBeTruthy();
      });

      it('properly loads portal id value', () => {
        expect(getAccountIdentifier(portalConfig)).toEqual(portalId);
      });

      it('properly loads api key value', () => {
        expect(portalConfig.apiKey).toEqual(apiKey);
      });
    });

    describe('personalaccesskey environment variable config', () => {
      const { portalId, personalAccessKey } = PERSONAL_ACCESS_KEY_CONFIG;
      let portalConfig: PersonalAccessKeyAccount | null;

      beforeEach(() => {
        process.env = {
          HUBSPOT_PORTAL_ID: `${portalId}`,
          HUBSPOT_PERSONAL_ACCESS_KEY: personalAccessKey,
        };
        getAndLoadConfigIfNeeded({ useEnv: true });
        portalConfig = getAccountConfig(portalId) as PersonalAccessKeyAccount;
        fsReadFileSyncSpy.mockReset();
      });

      afterEach(() => {
        // Clean up environment variable config so subsequent tests don't break
        process.env = {};
        setConfig(undefined);
        getAndLoadConfigIfNeeded();
      });

      it('does not load a config from file', () => {
        expect(fsReadFileSyncSpy).not.toHaveBeenCalled();
      });

      it('creates a portal config', () => {
        expect(portalConfig).toBeTruthy();
      });

      it('properly loads portal id value', () => {
        expect(getAccountIdentifier(portalConfig)).toEqual(portalId);
      });

      it('properly loads personal access key value', () => {
        expect(portalConfig?.personalAccessKey).toEqual(personalAccessKey);
      });
    });
  });

  describe('getAccountType()', () => {
    it('returns STANDARD when no accountType or sandboxAccountType is specified', () => {
      expect(getAccountType()).toBe(HUBSPOT_ACCOUNT_TYPES.STANDARD);
    });
    it('handles sandboxAccountType transforms correctly', () => {
      expect(getAccountType(undefined, 'DEVELOPER')).toBe(
        HUBSPOT_ACCOUNT_TYPES.DEVELOPMENT_SANDBOX
      );
      expect(getAccountType(undefined, 'STANDARD')).toBe(
        HUBSPOT_ACCOUNT_TYPES.STANDARD_SANDBOX
      );
    });
    it('handles accountType arg correctly', () => {
      expect(getAccountType(HUBSPOT_ACCOUNT_TYPES.STANDARD, 'DEVELOPER')).toBe(
        HUBSPOT_ACCOUNT_TYPES.STANDARD
      );
    });
  });

  describe('getConfigPath()', () => {
    beforeAll(() => {
      setConfigPath(CONFIG_PATHS.default);
    });

    describe('when a standard config is present', () => {
      it('returns the standard config path', () => {
        const configPath = getConfigPath();

        expect(configPath).toBe(CONFIG_PATHS.default);
      });
    });

    describe('when passed a path', () => {
      it('returns the path', () => {
        const randomConfigPath = '/some/random/path.config.yml';
        const configPath = getConfigPath(randomConfigPath);

        expect(configPath).toBe(randomConfigPath);
      });
    });

    describe('when no config is present', () => {
      beforeAll(() => {
        setConfigPath(CONFIG_PATHS.none);
        mockedConfigPath = CONFIG_PATHS.none;
      });

      afterAll(() => {
        setConfigPath(CONFIG_PATHS.default);
        mockedConfigPath = CONFIG_PATHS.default;
      });

      it('returns null', () => {
        const configPath = getConfigPath();

        expect(configPath).toBe(CONFIG_PATHS.none);
      });
    });

    describe('when a non-standard config is present', () => {
      beforeAll(() => {
        mockedConfigPath = CONFIG_PATHS.nonStandard;
        setConfigPath(CONFIG_PATHS.nonStandard);
      });

      afterAll(() => {
        setConfigPath(CONFIG_PATHS.default);
        mockedConfigPath = CONFIG_PATHS.default;
      });

      it('returns the non-standard config path', () => {
        const configPath = getConfigPath();

        expect(configPath).toBe(CONFIG_PATHS.nonStandard);
      });
    });
  });

  describe('createEmptyConfigFile()', () => {
    describe('when no config is present', () => {
      let fsExistsSyncSpy: jest.SpyInstance;

      beforeEach(() => {
        setConfigPath(CONFIG_PATHS.none);
        mockedConfigPath = CONFIG_PATHS.none;
        fsExistsSyncSpy = jest
          .spyOn(fs, 'existsSync')
          .mockImplementation(() => {
            return false;
          });
      });

      afterAll(() => {
        setConfigPath(CONFIG_PATHS.default);
        mockedConfigPath = CONFIG_PATHS.default;
        fsExistsSyncSpy.mockRestore();
      });

      it('writes a new config file', () => {
        createEmptyConfigFile();

        expect(fsWriteFileSyncSpy).toHaveBeenCalled();
      });
    });

    describe('when a config is present', () => {
      let fsExistsSyncAndReturnTrueSpy: jest.SpyInstance;

      beforeAll(() => {
        setConfigPath(CONFIG_PATHS.cwd);
        mockedConfigPath = CONFIG_PATHS.cwd;
        fsExistsSyncAndReturnTrueSpy = jest
          .spyOn(fs, 'existsSync')
          .mockImplementation(pathToCheck => {
            if (pathToCheck === CONFIG_PATHS.cwd) {
              return true;
            }

            return false;
          });
      });

      afterAll(() => {
        fsExistsSyncAndReturnTrueSpy.mockRestore();
      });

      it('does nothing', () => {
        createEmptyConfigFile();

        expect(fsWriteFileSyncSpy).not.toHaveBeenCalled();
      });
    });

    describe('when passed a path', () => {
      beforeAll(() => {
        setConfigPath(CONFIG_PATHS.none);
        mockedConfigPath = CONFIG_PATHS.none;
      });

      it('creates a config at the specified path', () => {
        const specifiedPath = '/some/path/that/has/never/been/used.config.yml';
        createEmptyConfigFile({ path: specifiedPath });

        expect(fsWriteFileSyncSpy).not.toHaveBeenCalledWith(specifiedPath);
      });
    });
  });

  describe('getRootOrDeprecatedConfigPath', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('returns root config path when useRootConfig is true', () => {
      const mockRootPath = '/Users/anonymous/config.yml';
      jest.spyOn(configFile, 'getConfigFilePath').mockReturnValue(mockRootPath);
      //jest.spyOn(config_DEPRECATED, 'getConfigPath');

      const result = getRootOrDeprecatedConfigPath(true);

      expect(result).toBe(mockRootPath);
      expect(configFile.getConfigFilePath).toHaveBeenCalled();
      // expect(config.DEPRECATED.getConfigPath).not.toHaveBeenCalled();
    });

    it('returns root config path when CLIConfiguration is active', () => {
      const mockRootPath = '/Users/anonymous/config.yml';
      jest.spyOn(configFile, 'getConfigFilePath').mockReturnValue(mockRootPath);
      //jest.spyOn(config_DEPRECATED, 'getConfigPath');

      const result = getRootOrDeprecatedConfigPath(true);

      expect(result).toBe(mockRootPath);
      expect(configFile.getConfigFilePath).toHaveBeenCalled();
      // expect(config.DEPRECATED.getConfigPath).not.toHaveBeenCalled();
    });
  });

  describe('bothConfigFilesExist', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('returns false when only root config file exists', () => {
      jest.spyOn(configFile, 'configFileExists').mockReturnValue(true);
      //jest.spyOn(config_DEPRECATED, 'getConfigPath').mockReturnValue(false);

      const result = bothConfigFilesExist();

      expect(result).toBe(false);
      expect(configFile.configFileExists).toHaveBeenCalled();
      // expect(config.DEPRECATED.getConfigPath).toHaveBeenCalled();
    });

    it('returns false when no config files exist', () => {
      jest.spyOn(configFile, 'configFileExists').mockReturnValue(false);
      //jest.spyOn(config_DEPRECATED, 'getConfigPath').mockReturnValue(false);

      const result = bothConfigFilesExist();

      expect(result).toBe(false);
      expect(configFile.configFileExists).toHaveBeenCalled();
      // expect(config.DEPRECATED.getConfigPath).toHaveBeenCalled();
    });
  });
});
