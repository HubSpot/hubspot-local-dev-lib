import * as migrate from '../migrate.js';
import * as config_DEPRECATED from '../config_DEPRECATED.js';
import { CLIConfiguration } from '../CLIConfiguration.js';
import * as configIndex from '../index.js';
import * as configFile from '../configFile.js';
import { CLIConfig_DEPRECATED, CLIConfig_NEW } from '../../types/Config.js';
import { ENVIRONMENTS } from '../../constants/environments.js';
import { OAUTH_AUTH_METHOD } from '../../constants/auth.js';
import { ARCHIVED_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../../constants/config.js';
import { i18n } from '../../utils/lang.js';
import fs from 'fs';
import path from 'path';
import { vi, type MockedFunction } from 'vitest';

// Mock dependencies
vi.mock('../config_DEPRECATED');
vi.mock('../CLIConfiguration');
vi.mock('../index');
vi.mock('../configFile');
vi.mock('../../utils/lang');
vi.mock('fs');
vi.mock('path');

const mockConfig_DEPRECATED = vi.mocked(config_DEPRECATED);
const mockCLIConfiguration = vi.mocked(CLIConfiguration);
const mockConfigIndex = vi.mocked(configIndex);
const mockConfigFile = vi.mocked(configFile);
const mockI18n = vi.mocked(i18n);
const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);

describe('migrate', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fs operations to prevent actual file system operations
    mockFs.renameSync = vi.fn();
    mockPath.dirname = vi.fn().mockReturnValue('/old/config');
    mockPath.join = vi.fn().mockImplementation((...args) => args.join('/'));
  });

  describe('getDeprecatedConfig', () => {
    it('should return deprecated config when loadConfig succeeds', () => {
      const mockDeprecatedConfig: CLIConfig_DEPRECATED = {
        defaultPortal: 'test-portal',
        portals: [],
      };
      mockConfig_DEPRECATED.loadConfig.mockReturnValue(mockDeprecatedConfig);

      const result = migrate.getDeprecatedConfig('/test/path');

      expect(mockConfig_DEPRECATED.loadConfig).toHaveBeenCalledWith(
        '/test/path'
      );
      expect(result).toBe(mockDeprecatedConfig);
    });

    it('should return null when loadConfig fails', () => {
      mockConfig_DEPRECATED.loadConfig.mockReturnValue(null);

      const result = migrate.getDeprecatedConfig();

      expect(mockConfig_DEPRECATED.loadConfig).toHaveBeenCalledWith(undefined);
      expect(result).toBeNull();
    });

    it('should call loadConfig with undefined when no configPath provided', () => {
      mockConfig_DEPRECATED.loadConfig.mockReturnValue(null);

      migrate.getDeprecatedConfig();

      expect(mockConfig_DEPRECATED.loadConfig).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getGlobalConfig', () => {
    it('should return CLIConfiguration config when active', () => {
      const mockConfig: CLIConfig_NEW = {
        defaultAccount: 'test-account',
        accounts: [],
      };
      mockCLIConfiguration.isActive.mockReturnValue(true);
      mockCLIConfiguration.config = mockConfig;

      const result = migrate.getGlobalConfig();

      expect(mockCLIConfiguration.isActive).toHaveBeenCalled();
      expect(result).toBe(mockConfig);
    });

    it('should return null when CLIConfiguration is not active', () => {
      mockCLIConfiguration.isActive.mockReturnValue(false);

      const result = migrate.getGlobalConfig();

      expect(mockCLIConfiguration.isActive).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('configFileExists', () => {
    it('should check new config file when useHiddenConfig is true', () => {
      mockConfigFile.configFileExists.mockReturnValue(true);

      const result = migrate.configFileExists(true);

      expect(mockConfigFile.configFileExists).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should check deprecated config file when useHiddenConfig is false', () => {
      const mockConfigPath = '/test/config.yml';
      mockConfig_DEPRECATED.getConfigPath.mockReturnValue(mockConfigPath);

      const result = migrate.configFileExists(false, '/test/path');

      expect(mockConfig_DEPRECATED.getConfigPath).toHaveBeenCalledWith(
        '/test/path'
      );
      expect(result).toBe(true);
    });

    it('should return false when deprecated config path is null', () => {
      mockConfig_DEPRECATED.getConfigPath.mockReturnValue(null);

      const result = migrate.configFileExists(false);

      expect(result).toBe(false);
    });

    it('should default useHiddenConfig to false', () => {
      mockConfig_DEPRECATED.getConfigPath.mockReturnValue(null);

      migrate.configFileExists();

      expect(mockConfig_DEPRECATED.getConfigPath).toHaveBeenCalledWith(
        undefined
      );
    });
  });

  describe('getConfigPath', () => {
    it('should return new config file path when useHiddenConfig is true', () => {
      const mockPath = '/test/new/config';
      mockConfigFile.getConfigFilePath.mockReturnValue(mockPath);

      const result = migrate.getConfigPath('/test/path', true);

      expect(mockConfigFile.getConfigFilePath).toHaveBeenCalled();
      expect(result).toBe(mockPath);
    });

    it('should return deprecated config path when useHiddenConfig is false', () => {
      const mockPath = '/test/deprecated/config';
      mockConfig_DEPRECATED.getConfigPath.mockReturnValue(mockPath);

      const result = migrate.getConfigPath('/test/path', false);

      expect(mockConfig_DEPRECATED.getConfigPath).toHaveBeenCalledWith(
        '/test/path'
      );
      expect(result).toBe(mockPath);
    });

    it('should default useHiddenConfig to false', () => {
      const mockPath = '/test/deprecated/config';
      mockConfig_DEPRECATED.getConfigPath.mockReturnValue(mockPath);

      const result = migrate.getConfigPath('/test/path');

      expect(mockConfig_DEPRECATED.getConfigPath).toHaveBeenCalledWith(
        '/test/path'
      );
      expect(result).toBe(mockPath);
    });
  });

  describe('migrateConfig', () => {
    beforeEach(() => {
      mockI18n.mockImplementation(key => `translated-${key}`);
      mockConfigIndex.createEmptyConfigFile.mockImplementation(() => {});
      mockConfigIndex.loadConfig.mockImplementation(() => null);
      mockConfigIndex.writeConfig.mockImplementation(() => {});
      mockConfigIndex.deleteEmptyConfigFile.mockImplementation(() => {});
      mockConfig_DEPRECATED.getConfigPath.mockReturnValue('/old/config/path');
      mockPath.dirname.mockReturnValue('/old/config');
      mockPath.join.mockReturnValue(
        `/old/config/${ARCHIVED_HUBSPOT_CONFIG_YAML_FILE_NAME}`
      );
      mockFs.renameSync.mockImplementation(() => {});
    });

    it('should throw error when deprecatedConfig is null', () => {
      expect(() => migrate.migrateConfig(null)).toThrow(
        'translated-config.migrate.errors.noDeprecatedConfig'
      );
      expect(mockI18n).toHaveBeenCalledWith(
        'config.migrate.errors.noDeprecatedConfig'
      );
    });

    it('should migrate config successfully', () => {
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        defaultPortal: 'test-portal',
        portals: [
          {
            portalId: 123,
            name: 'test-account',
            authType: OAUTH_AUTH_METHOD.value,
            env: ENVIRONMENTS.PROD,
          },
        ],
        httpTimeout: 30000,
        allowUsageTracking: true,
      };

      migrate.migrateConfig(deprecatedConfig);

      expect(mockConfigIndex.createEmptyConfigFile).toHaveBeenCalledWith(
        {},
        true
      );
      expect(mockConfigIndex.loadConfig).toHaveBeenCalledWith('');
      expect(mockConfigIndex.writeConfig).toHaveBeenCalledWith({
        source: JSON.stringify({
          httpTimeout: 30000,
          allowUsageTracking: true,
          defaultAccount: 'test-portal',
          accounts: [
            {
              name: 'test-account',
              authType: OAUTH_AUTH_METHOD.value,
              env: ENVIRONMENTS.PROD,
              accountId: 123,
            },
          ],
        }),
      });
    });

    it('should handle portals with undefined portalId', () => {
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        defaultPortal: 'test-portal',
        portals: [
          {
            portalId: 123,
            name: 'valid-account',
            env: ENVIRONMENTS.PROD,
          },
          {
            portalId: undefined,
            name: 'invalid-account',
            env: ENVIRONMENTS.PROD,
          },
        ],
      };

      migrate.migrateConfig(deprecatedConfig);

      const writeConfigCall = mockConfigIndex.writeConfig.mock.calls[0]?.[0];
      expect(writeConfigCall).toBeDefined();
      expect(writeConfigCall?.source).toBeDefined();
      const parsedConfig = JSON.parse(writeConfigCall!.source!);

      expect(parsedConfig.accounts).toHaveLength(1);
      expect(parsedConfig.accounts[0]).toEqual({
        name: 'valid-account',
        accountId: 123,
        env: ENVIRONMENTS.PROD,
      });
    });

    it('should rename old config file after successful migration', () => {
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        defaultPortal: 'test-portal',
        portals: [],
      };

      migrate.migrateConfig(deprecatedConfig);

      expect(mockConfig_DEPRECATED.getConfigPath).toHaveBeenCalled();
      expect(mockPath.dirname).toHaveBeenCalledWith('/old/config/path');
      expect(mockPath.join).toHaveBeenCalledWith(
        '/old/config',
        ARCHIVED_HUBSPOT_CONFIG_YAML_FILE_NAME
      );
      expect(mockFs.renameSync).toHaveBeenCalledWith(
        '/old/config/path',
        `/old/config/${ARCHIVED_HUBSPOT_CONFIG_YAML_FILE_NAME}`
      );
    });

    it('should handle writeConfig error and clean up', () => {
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        defaultPortal: 'test-portal',
        portals: [],
      };
      const writeError = new Error('Write failed');
      mockConfigIndex.writeConfig.mockImplementation(() => {
        throw writeError;
      });

      expect(() => migrate.migrateConfig(deprecatedConfig)).toThrow(
        'translated-config.migrate.errors.writeConfig'
      );
      expect(mockConfigIndex.deleteEmptyConfigFile).toHaveBeenCalled();
    });
  });

  describe('mergeConfigProperties', () => {
    it('should merge properties without conflicts when force is true', () => {
      const globalConfig: CLIConfig_NEW = {
        defaultAccount: 'global-account',
        accounts: [],
        httpTimeout: 10000,
      };
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        defaultPortal: 'deprecated-portal',
        portals: [],
        httpTimeout: 20000,
        allowUsageTracking: false,
      };

      const result = migrate.mergeConfigProperties(
        globalConfig,
        deprecatedConfig,
        true
      );

      expect(result.initialConfig).toEqual({
        defaultAccount: 'deprecated-portal',
        accounts: [],
        httpTimeout: 20000,
        allowUsageTracking: false,
      });
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect conflicts when force is false and values differ', () => {
      const globalConfig: CLIConfig_NEW = {
        defaultAccount: 'global-account',
        accounts: [],
        httpTimeout: 10000,
      };
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        defaultPortal: 'deprecated-portal',
        portals: [],
        httpTimeout: 20000,
      };

      const result = migrate.mergeConfigProperties(
        globalConfig,
        deprecatedConfig,
        false
      );

      expect(result.conflicts).toHaveLength(2);
      expect(result.conflicts).toContainEqual({
        property: 'httpTimeout',
        oldValue: 20000,
        newValue: 10000,
      });
      expect(result.conflicts).toContainEqual({
        property: 'defaultAccount',
        oldValue: 'deprecated-portal',
        newValue: 'global-account',
      });
    });

    it('should merge flags from both configs', () => {
      const globalConfig: CLIConfig_NEW = {
        accounts: [],
        flags: ['flag1', 'flag2'],
      };
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        portals: [],
        flags: ['flag2', 'flag3'],
      };

      const result = migrate.mergeConfigProperties(
        globalConfig,
        deprecatedConfig
      );

      expect(result.initialConfig.flags).toEqual(['flag1', 'flag2', 'flag3']);
    });

    it('should handle missing properties gracefully', () => {
      const globalConfig: CLIConfig_NEW = {
        accounts: [],
      };
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        portals: [],
        httpTimeout: 15000,
      };

      const result = migrate.mergeConfigProperties(
        globalConfig,
        deprecatedConfig
      );

      expect(result.initialConfig.httpTimeout).toBe(15000);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should not create conflicts when values are the same', () => {
      const globalConfig: CLIConfig_NEW = {
        accounts: [],
        httpTimeout: 15000,
        allowUsageTracking: true,
      };
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        portals: [],
        httpTimeout: 15000,
        allowUsageTracking: true,
      };

      const result = migrate.mergeConfigProperties(
        globalConfig,
        deprecatedConfig
      );

      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('mergeExistingConfigs', () => {
    beforeEach(() => {
      mockConfigIndex.writeConfig.mockImplementation(() => {});
    });

    it('should merge accounts and return skipped account IDs', () => {
      const globalConfig: CLIConfig_NEW = {
        accounts: [
          {
            accountId: 123,
            name: 'existing-account',
            env: ENVIRONMENTS.PROD,
          },
        ],
      };
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        portals: [
          {
            portalId: 123,
            name: 'duplicate-account',
            env: ENVIRONMENTS.PROD,
          },
          {
            portalId: 456,
            name: 'new-account',
            env: ENVIRONMENTS.PROD,
          },
        ],
      };

      const result = migrate.mergeExistingConfigs(
        globalConfig,
        deprecatedConfig
      );

      expect(result.finalConfig.accounts).toHaveLength(2);
      expect(result.finalConfig.accounts).toContainEqual({
        accountId: 123,
        name: 'existing-account',
        env: ENVIRONMENTS.PROD,
      });
      expect(result.finalConfig.accounts).toContainEqual({
        accountId: 456,
        name: 'new-account',
        env: ENVIRONMENTS.PROD,
      });
      expect(result.skippedAccountIds).toEqual([123]);
    });

    it('should handle config without existing accounts', () => {
      const globalConfig: CLIConfig_NEW = {
        accounts: [],
      };
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        portals: [
          {
            portalId: 123,
            name: 'new-account',
            env: ENVIRONMENTS.PROD,
          },
        ],
      };

      const result = migrate.mergeExistingConfigs(
        globalConfig,
        deprecatedConfig
      );

      expect(result.finalConfig.accounts).toHaveLength(1);
      expect(result.finalConfig.accounts[0]).toEqual({
        name: 'new-account',
        accountId: 123,
        env: ENVIRONMENTS.PROD,
      });
      expect(result.skippedAccountIds).toHaveLength(0);
    });

    it('should handle config without deprecated portals', () => {
      const globalConfig: CLIConfig_NEW = {
        accounts: [
          {
            accountId: 123,
            name: 'existing-account',
            env: ENVIRONMENTS.PROD,
          },
        ],
      };
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        portals: [],
      };

      const result = migrate.mergeExistingConfigs(
        globalConfig,
        deprecatedConfig
      );

      expect(result.finalConfig.accounts).toHaveLength(1);
      expect(result.skippedAccountIds).toHaveLength(0);
    });

    it('should write the final config', () => {
      const globalConfig: CLIConfig_NEW = {
        accounts: [],
      };
      const deprecatedConfig: CLIConfig_DEPRECATED = {
        portals: [],
      };

      migrate.mergeExistingConfigs(globalConfig, deprecatedConfig);

      expect(mockConfigIndex.writeConfig).toHaveBeenCalledWith({
        source: JSON.stringify(globalConfig),
      });
    });
  });
});
