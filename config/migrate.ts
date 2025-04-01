import fs from 'fs';

import * as config_DEPRECATED from './config_DEPRECATED';
import { CLIConfiguration } from './CLIConfiguration';
import {
  CLIConfig,
  CLIConfig_DEPRECATED,
  CLIConfig_NEW,
  Environment,
} from '../types/Config';
import { CmsPublishMode } from '../types/Files';
import {
  writeConfig,
  createEmptyConfigFile,
  loadConfig,
  deleteEmptyConfigFile,
} from './index';
import {
  getConfigFilePath,
  configFileExists as newConfigFileExists,
} from './configFile';
import {
  GLOBAL_CONFIG_PATH,
  DEFAULT_CMS_PUBLISH_MODE,
  HTTP_TIMEOUT,
  ENV,
  HTTP_USE_LOCALHOST,
  ALLOW_USAGE_TRACKING,
  DEFAULT_ACCOUNT,
  DEFAULT_PORTAL,
} from '../constants/config';
import { i18n } from '../utils/lang';

const i18nKey = 'config.migrate';

export function getDeprecatedConfig(
  configPath?: string
): CLIConfig_DEPRECATED | null {
  return config_DEPRECATED.loadConfig(configPath);
}

export function getGlobalConfig(): CLIConfig_NEW | null {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.config;
  }
  return null;
}

export function configFileExists(
  useHiddenConfig = false,
  configPath?: string
): boolean {
  return useHiddenConfig
    ? newConfigFileExists()
    : Boolean(configPath && fs.existsSync(configPath)) ||
        Boolean(config_DEPRECATED.loadConfig(configPath));
}

export function getConfigPath(
  configPath?: string,
  useHiddenConfig = false
): string | null {
  if (useHiddenConfig) {
    return getConfigFilePath();
  }
  return config_DEPRECATED.getConfigPath(configPath);
}

function writeGlobalConfigFile(
  updatedConfig: CLIConfig_NEW,
  isMigrating = false
): void {
  const updatedConfigJson = JSON.stringify(updatedConfig);
  if (isMigrating) {
    createEmptyConfigFile({}, true);
  }
  loadConfig('');

  try {
    writeConfig({ source: updatedConfigJson });
    config_DEPRECATED.deleteConfigFile();
  } catch (error) {
    deleteEmptyConfigFile();
    throw new Error(
      i18n(`${i18nKey}.errors.writeConfig`, { configPath: GLOBAL_CONFIG_PATH }),
      { cause: error }
    );
  }
}

export function migrateConfig(
  deprecatedConfig: CLIConfig_DEPRECATED | null
): void {
  if (!deprecatedConfig) {
    throw new Error(i18n(`${i18nKey}.errors.noDeprecatedConfig`));
  }
  const { defaultPortal, portals, ...rest } = deprecatedConfig;
  const updatedConfig = {
    ...rest,
    defaultAccount: defaultPortal,
    accounts: portals
      .filter(({ portalId }) => portalId !== undefined)
      .map(({ portalId, ...rest }) => ({
        ...rest,
        accountId: portalId!,
      })),
  };
  writeGlobalConfigFile(updatedConfig, true);
}

type ConflictValue = boolean | string | number | CmsPublishMode | Environment;
export type ConflictProperty = {
  property: keyof CLIConfig_NEW;
  oldValue: ConflictValue;
  newValue: ConflictValue;
};

export function mergeConfigProperties(
  globalConfig: CLIConfig_NEW,
  deprecatedConfig: CLIConfig_DEPRECATED,
  force?: boolean
): {
  initialConfig: CLIConfig_NEW;
  conflicts: Array<ConflictProperty>;
} {
  const propertiesToCheck: Array<keyof Partial<CLIConfig>> = [
    DEFAULT_CMS_PUBLISH_MODE,
    HTTP_TIMEOUT,
    ENV,
    HTTP_USE_LOCALHOST,
    ALLOW_USAGE_TRACKING,
  ];
  const conflicts: Array<ConflictProperty> = [];

  propertiesToCheck.forEach(prop => {
    if (prop in globalConfig && prop in deprecatedConfig) {
      if (force || globalConfig[prop] === deprecatedConfig[prop]) {
        // @ts-expect-error Cannot reconcile CLIConfig_NEW and CLIConfig_DEPRECATED types
        globalConfig[prop] = deprecatedConfig[prop];
      } else {
        conflicts.push({
          property: prop,
          oldValue: deprecatedConfig[prop]!,
          newValue: globalConfig[prop]!,
        });
      }
    }
  });

  if (
    DEFAULT_ACCOUNT in globalConfig &&
    DEFAULT_PORTAL in deprecatedConfig &&
    globalConfig.defaultAccount !== deprecatedConfig.defaultPortal
  ) {
    if (force) {
      globalConfig.defaultAccount = deprecatedConfig.defaultPortal;
    } else {
      conflicts.push({
        property: DEFAULT_ACCOUNT,
        oldValue: deprecatedConfig.defaultPortal!,
        newValue: globalConfig.defaultAccount!,
      });
    }
  } else if (DEFAULT_PORTAL in deprecatedConfig) {
    globalConfig.defaultAccount = deprecatedConfig.defaultPortal;
  }

  return { initialConfig: globalConfig, conflicts };
}

function mergeAccounts(
  globalConfig: CLIConfig_NEW,
  deprecatedConfig: CLIConfig_DEPRECATED
): {
  finalConfig: CLIConfig_NEW;
  skippedAccountIds: Array<string | number>;
} {
  let existingAccountIds: Array<string | number> = [];
  const skippedAccountIds: Array<string | number> = [];

  if (globalConfig.accounts && deprecatedConfig.portals) {
    existingAccountIds = globalConfig.accounts.map(
      account => account.accountId
    );

    const newAccounts = deprecatedConfig.portals
      .filter(portal => {
        const isExisting = existingAccountIds.includes(portal.portalId!);
        if (isExisting) {
          skippedAccountIds.push(portal.portalId!);
        }
        return !isExisting;
      })
      .map(({ portalId, ...rest }) => ({
        ...rest,
        accountId: portalId!,
      }));

    if (newAccounts.length > 0) {
      globalConfig.accounts.push(...newAccounts);
    }
  }

  return {
    finalConfig: globalConfig,
    skippedAccountIds,
  };
}

export function mergeExistingConfigs(
  globalConfig: CLIConfig_NEW,
  deprecatedConfig: CLIConfig_DEPRECATED
): { finalConfig: CLIConfig_NEW; skippedAccountIds: Array<string | number> } {
  const { finalConfig, skippedAccountIds } = mergeAccounts(
    globalConfig,
    deprecatedConfig
  );

  writeGlobalConfigFile(finalConfig);
  return { finalConfig, skippedAccountIds };
}
