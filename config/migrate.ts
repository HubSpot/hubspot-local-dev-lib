import fs from 'fs';

import { HubSpotConfig } from '../types/Config';
import { createEmptyConfigFile } from './index';
import {
  DEFAULT_CMS_PUBLISH_MODE,
  HTTP_TIMEOUT,
  ENV,
  HTTP_USE_LOCALHOST,
  ALLOW_USAGE_TRACKING,
  DEFAULT_ACCOUNT,
  AUTO_OPEN_BROWSER,
  ALLOW_AUTO_UPDATES,
} from '../constants/config';
import {
  getGlobalConfigFilePath,
  parseConfig,
  readConfigFile,
  writeConfigFile,
} from './utils';
import { ValueOf } from '../types/Utils';

export function getConfigAtPath(path: string): HubSpotConfig {
  const configFileSource = readConfigFile(path);

  return parseConfig(configFileSource);
}

export function migrateConfigAtPath(path: string): void {
  createEmptyConfigFile(true);
  const configToMigrate = getConfigAtPath(path);
  writeConfigFile(configToMigrate, getGlobalConfigFilePath());
  fs.unlinkSync(path);
}

export type ConflictProperty = {
  property: keyof HubSpotConfig;
  oldValue: ValueOf<HubSpotConfig>;
  newValue: ValueOf<Required<HubSpotConfig>>;
};

export function mergeConfigProperties(
  toConfig: HubSpotConfig,
  fromConfig: HubSpotConfig,
  force?: boolean
): {
  configWithMergedProperties: HubSpotConfig;
  conflicts: Array<ConflictProperty>;
} {
  const conflicts: Array<ConflictProperty> = [];

  if (force) {
    toConfig.defaultCmsPublishMode = fromConfig.defaultCmsPublishMode;
    toConfig.httpTimeout = fromConfig.httpTimeout;
    toConfig.env = fromConfig.env;
    toConfig.httpUseLocalhost = fromConfig.httpUseLocalhost;
    toConfig.allowUsageTracking = fromConfig.allowUsageTracking;
    toConfig.autoOpenBrowser = fromConfig.autoOpenBrowser;
    toConfig.allowAutoUpdates = fromConfig.allowAutoUpdates;
    toConfig.defaultAccount = fromConfig.defaultAccount;
  } else {
    toConfig.defaultCmsPublishMode ||= fromConfig.defaultCmsPublishMode;
    toConfig.httpTimeout ||= fromConfig.httpTimeout;
    toConfig.env ||= fromConfig.env;
    toConfig.httpUseLocalhost =
      toConfig.httpUseLocalhost === undefined
        ? fromConfig.httpUseLocalhost
        : toConfig.httpUseLocalhost;
    toConfig.allowUsageTracking =
      toConfig.allowUsageTracking === undefined
        ? fromConfig.allowUsageTracking
        : toConfig.allowUsageTracking;
    toConfig.autoOpenBrowser =
      toConfig.autoOpenBrowser === undefined
        ? fromConfig.autoOpenBrowser
        : toConfig.autoOpenBrowser;
    toConfig.allowAutoUpdates =
      toConfig.allowAutoUpdates === undefined
        ? fromConfig.allowAutoUpdates
        : toConfig.allowAutoUpdates;
    toConfig.defaultAccount ||= fromConfig.defaultAccount;

    const propertiesToCheck = [
      DEFAULT_CMS_PUBLISH_MODE,
      HTTP_TIMEOUT,
      ENV,
      HTTP_USE_LOCALHOST,
      ALLOW_USAGE_TRACKING,
      AUTO_OPEN_BROWSER,
      ALLOW_AUTO_UPDATES,
      DEFAULT_ACCOUNT,
    ] as const;

    propertiesToCheck.forEach(prop => {
      if (toConfig[prop] !== undefined && toConfig[prop] !== fromConfig[prop]) {
        conflicts.push({
          property: prop,
          oldValue: fromConfig[prop],
          newValue: toConfig[prop]!,
        });
      }
    });
  }

  // Merge flags
  if (toConfig.flags || fromConfig.flags) {
    toConfig.flags = Array.from(
      new Set([...(toConfig.flags || []), ...(fromConfig.flags || [])])
    );
  }

  return { configWithMergedProperties: toConfig, conflicts };
}

function buildConfigWithMergedAccounts(
  toConfig: HubSpotConfig,
  fromConfig: HubSpotConfig
): {
  configWithMergedAccounts: HubSpotConfig;
  skippedAccountIds: Array<number>;
} {
  const existingAccountIds = toConfig.accounts.map(
    ({ accountId }) => accountId
  );
  const skippedAccountIds: Array<number> = [];

  fromConfig.accounts.forEach(account => {
    if (existingAccountIds.includes(account.accountId)) {
      skippedAccountIds.push(account.accountId);
    } else {
      toConfig.accounts.push(account);
    }
  });

  return {
    configWithMergedAccounts: toConfig,
    skippedAccountIds,
  };
}

export function mergeConfigAccounts(
  toConfig: HubSpotConfig,
  fromConfig: HubSpotConfig
): {
  configWithMergedAccounts: HubSpotConfig;
  skippedAccountIds: Array<string | number>;
} {
  const { configWithMergedAccounts, skippedAccountIds } =
    buildConfigWithMergedAccounts(toConfig, fromConfig);

  writeConfigFile(configWithMergedAccounts, getGlobalConfigFilePath());
  return { configWithMergedAccounts, skippedAccountIds };
}
