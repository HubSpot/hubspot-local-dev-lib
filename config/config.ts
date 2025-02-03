import fs from 'fs-extra';
import findup from 'findup-sync';

import { DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../constants/config';
import { HubSpotConfigAccount } from '../types/Accounts';
import { HubSpotConfig, Environment, ConfigFlag } from '../types/Config';
import { CmsPublishMode } from '../types/Files';
import { logger } from '../lib/logger';
import { i18n } from '../utils/lang';
import {
  getGlobalConfigFilePath,
  readConfigFile,
  parseConfig,
  buildConfigFromEnvironment,
  writeConfigFile,
} from './configUtils';

export function getDefaultConfigFilePath(): string {
  const globalConfigFilePath = getGlobalConfigFilePath();

  if (fs.existsSync(globalConfigFilePath)) {
    return globalConfigFilePath;
  }

  const localConfigPath = findup([
    DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
    DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME.replace('.yml', '.yaml'),
  ]);

  if (!localConfigPath) {
    throw new Error('@TODO');
  }

  return localConfigPath;
}

export function getConfig(
  configFilePath: string | null,
  useEnv: boolean
): HubSpotConfig {
  if (configFilePath && useEnv) {
    throw new Error('@TODO');
  }

  if (useEnv) {
    return buildConfigFromEnvironment();
  }

  const pathToRead = configFilePath || getDefaultConfigFilePath();

  logger.debug(`@TODOReading config from ${pathToRead}`);
  const configFileSource = readConfigFile(pathToRead);

  return parseConfig(configFileSource);
}

export function isConfigValid(
  configFilePath: string | null,
  useEnv: boolean
): boolean {
  const config = getConfig(configFilePath, useEnv);

  if (config.accounts.length === 0) {
    logger.log('@TODO');
    return false;
  }

  const accountIdsMap: { [key: number]: boolean } = {};
  const accountNamesMap: { [key: string]: boolean } = {};

  return config.accounts.every(account => {
    if (!account) {
      logger.log('@TODO');
      return false;
    }
    if (!account.accountId) {
      logger.log('@TODO');
      return false;
    }
    if (accountIdsMap[account.accountId]) {
      logger.log('@TODO');
      return false;
    }
    if (account.name) {
      if (accountNamesMap[account.name.toLowerCase()]) {
        logger.log('@TODO');
        return false;
      }
      if (/\s+/.test(account.name)) {
        logger.log('@TODO');
        return false;
      }
      accountNamesMap[account.name] = true;
    }

    accountIdsMap[account.accountId] = true;
    return true;
  });
}

export function createEmptyConfigFile(
  configFilePath: string,
  useEnv: boolean
): void {
  if (configFilePath && useEnv) {
    throw new Error('@TODO');
  } else if (useEnv) {
    return;
  }

  const pathToWrite = configFilePath || getDefaultConfigFilePath();

  writeConfigFile({ accounts: [] }, pathToWrite);
}

export function deleteConfigFile(
  configFilePath: string,
  useEnv: boolean
): void {
  if (configFilePath && useEnv) {
    throw new Error('@TODO');
  } else if (useEnv) {
    return;
  }

  const pathToDelete = configFilePath || getDefaultConfigFilePath();
  fs.unlinkSync(pathToDelete);
}

function getConfigAccountById(accountId: number): HubSpotConfigAccount {}

function getConfigAccountByName(accountName: string): HubSpotConfigAccount {}

function getConfigDefaultAccount(): HubSpotConfigAccount {}

function getAllConfigAccounts(): HubSpotConfigAccount[];

function getAccountEnvironmentById(accountId: number): Environment {}

function getDefaultAccountEnvironment(): Environment {}

function updateConfigAccount(
  accoundId: number,
  fieldsToUpdate: object
): HubSpotConfigAccount {}

function setConfigAccountAsDefault(accountId: number): void {}

function renameConfigAccount(accountId: number, newName: string): void {}

function removeAccountFromConfig(accountId: number): void {}

function updateHttpTimeout(timeout: number): void {}

function updateAllowUsageTracking(isAllowed: boolean): void {}

function updateDefaultCmsPublishMode(cmsPublishMode: CmsPublishMode): void {}

function isConfigFlagEnabled(flag: ConfigFlag): boolean {}

function isUsageTrackingAllowed(): boolean {}
