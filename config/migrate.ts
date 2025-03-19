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
  deleteConfigFile,
} from './index';
import { GLOBAL_CONFIG_PATH } from '../constants/config';
import { i18n } from '../utils/lang';
import { logger } from '../lib/logger';

const i18nKey = 'config.migrate';

function writeGlobalConfigFile(updatedConfig: CLIConfig_NEW): void {
  const updatedConfigJson = JSON.stringify(updatedConfig);
  createEmptyConfigFile({}, true);
  loadConfig('');

  try {
    writeConfig({ source: updatedConfigJson });
    deleteConfigFile(true);
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
    throw new Error(i18n(`${i18nKey}.errors.noDefaultConfig`));
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
  writeGlobalConfigFile(updatedConfig);
}

function mergeConfigPropertes(
  globalConfig: CLIConfig_NEW,
  deprecatedConfig: CLIConfig_DEPRECATED
): CLIConfig_NEW {
  const propertiesToCheck: Array<keyof Partial<CLIConfig>> = [
    'defaultCmsPublishMode',
    'httpTimeout',
    'allowUsageTracking',
    'env',
  ];
  const conflicts: Array<{
    property: keyof CLIConfig;
    oldValue: boolean | string | number | CmsPublishMode | Environment;
    newValue: boolean | string | number | CmsPublishMode | Environment;
  }> = [];

  propertiesToCheck.forEach(prop => {
    if (prop in globalConfig && prop in deprecatedConfig) {
      if (globalConfig[prop] !== deprecatedConfig[prop]) {
        conflicts.push({
          property: prop,
          oldValue: deprecatedConfig[prop]!,
          newValue: globalConfig[prop]!,
        });
      }
    } else {
      // @ts-expect-error TODO
      globalConfig[prop] = deprecatedConfig[prop];
    }
  });

  if (conflicts.length > 0) {
    logger.log(
      `The following properties have different values in the deprecated and global config files:\n${conflicts
        .map(
          ({ property, oldValue, newValue }) =>
            `${property}: ${oldValue} (deprecated) vs ${newValue} (global)`
        )
        .join('\n')}`
    );
    return globalConfig;
  }

  return globalConfig;
}

function mergeAccounts(
  globalConfig: CLIConfig_NEW,
  deprecatedConfig: CLIConfig_DEPRECATED
): CLIConfig_NEW {
  if (globalConfig.accounts && deprecatedConfig.portals) {
    const existingPortalIds = new Set(
      globalConfig.accounts.map(account => account.accountId)
    );

    const newAccounts = deprecatedConfig.portals
      .filter(portal => !existingPortalIds.has(portal.portalId!))
      .map(({ portalId, ...rest }) => ({
        ...rest,
        accountId: portalId!,
      }));

    if (newAccounts.length > 0) {
      globalConfig.accounts.push(...newAccounts);
    }
  }

  return globalConfig;
}

export function mergeExistingConfigs(
  globalConfig: CLIConfig_NEW,
  deprecatedConfig: CLIConfig_DEPRECATED
): void {
  const updatedConfig = mergeConfigPropertes(globalConfig, deprecatedConfig);
  const finalConfig = mergeAccounts(updatedConfig, deprecatedConfig);

  writeGlobalConfigFile(finalConfig);
}
