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
  getLocalConfigFileDefaultPath,
  getConfigAccountByIdentifier,
  removeUndefinedFieldsFromConfigAccount,
  hasAuthField,
  isValidHubSpotConfigAccount,
  getConfigAccountIndexById,
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
  configFilePath: string | null,
  useGlobalConfig = false
): void {
  const defaultPath = useGlobalConfig
    ? getGlobalConfigFilePath()
    : getLocalConfigFileDefaultPath();

  const pathToWrite = configFilePath || defaultPath;

  writeConfigFile({ accounts: [] }, pathToWrite);
}

export function deleteConfigFile(configFilePath: string | null): void {
  const pathToDelete = configFilePath || getDefaultConfigFilePath();
  fs.unlinkSync(pathToDelete);
}

export function getConfigAccountById(
  configFilePath: string | null,
  useEnv: boolean,
  accountId: number
): HubSpotConfigAccount {
  const { accounts } = getConfig(configFilePath, useEnv);

  const account = getConfigAccountByIdentifier(
    accounts,
    'accountId',
    accountId
  );

  if (!account) {
    throw new Error('@TODO account not found');
  }

  return account;
}

export function getConfigAccountByName(
  configFilePath: string | null,
  useEnv: boolean,
  accountName: string
): HubSpotConfigAccount {
  const { accounts } = getConfig(configFilePath, useEnv);

  const account = getConfigAccountByIdentifier(accounts, 'name', accountName);

  if (!account) {
    throw new Error('@TODO account not found');
  }

  return account;
}

export function getConfigDefaultAccount(
  configFilePath: string | null,
  useEnv: boolean
): HubSpotConfigAccount {
  const { accounts, defaultAccount } = getConfig(configFilePath, useEnv);

  if (!defaultAccount) {
    throw new Error('@TODO no default account');
  }

  const account = getConfigAccountByIdentifier(
    accounts,
    'name',
    defaultAccount
  );

  if (!account) {
    throw new Error('@TODO no default account');
  }

  return account;
}

export function getAllConfigAccounts(
  configFilePath: string | null,
  useEnv: boolean
): HubSpotConfigAccount[] {
  const { accounts } = getConfig(configFilePath, useEnv);

  return accounts;
}

// @TODO: Add logger debugs?
export function addConfigAccount(
  configFilePath: string | null,
  accountToAdd: HubSpotConfigAccount
): void {
  const config = getConfig(configFilePath, false);
  const accountInConfig = getConfigAccountByIdentifier(
    config.accounts,
    'accountId',
    accountToAdd.accountId
  );

  if (accountInConfig) {
    throw new Error('@TODO account already exists');
  }

  const configToWrite = removeUndefinedFieldsFromConfigAccount(accountToAdd);

  config.accounts.push(configToWrite);

  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

export function updateConfigAccount(
  configFilePath: string | null,
  accountId: number,
  fieldsToUpdate: Partial<HubSpotConfigAccount>
): void {
  if (fieldsToUpdate.accountId !== accountId) {
    throw new Error('@TODO');
  }

  const config = getConfig(configFilePath, false);

  const accountToUpdate = getConfigAccountByIdentifier(
    config.accounts,
    'accountId',
    accountId
  );

  if (!accountToUpdate) {
    throw new Error('@TODO account not found');
  }

  const cleanedFieldsToUpdate =
    removeUndefinedFieldsFromConfigAccount(fieldsToUpdate);

  const accountAuth = hasAuthField(accountToUpdate) ? accountToUpdate.auth : {};

  const authFieldsToUpdate = hasAuthField(cleanedFieldsToUpdate)
    ? { auth: { ...accountAuth, ...cleanedFieldsToUpdate.auth } }
    : {};

  const updatedAccount = {
    ...accountToUpdate,
    ...cleanedFieldsToUpdate,
    ...authFieldsToUpdate,
  };

  if (!isValidHubSpotConfigAccount(updatedAccount)) {
    throw new Error('@TODO');
  }

  const accountIndex = getConfigAccountIndexById(config.accounts, accountId);
  config.accounts[accountIndex] = updatedAccount;

  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

function setConfigAccountAsDefault(accountId: number): void {}

function renameConfigAccount(accountId: number, newName: string): void {}

function removeAccountFromConfig(accountId: number): void {}

function updateHttpTimeout(timeout: number): void {}

function updateAllowUsageTracking(isAllowed: boolean): void {}

function updateDefaultCmsPublishMode(cmsPublishMode: CmsPublishMode): void {}

function isConfigFlagEnabled(flag: ConfigFlag): boolean {}

function isUsageTrackingAllowed(): boolean {}
