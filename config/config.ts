import fs from 'fs-extra';
import findup from 'findup-sync';

import {
  DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
  MIN_HTTP_TIMEOUT,
} from '../constants/config';
import { HubSpotConfigAccount } from '../types/Accounts';
import { HubSpotConfig, ConfigFlag } from '../types/Config';
import { CmsPublishMode } from '../types/Files';
import { logger } from '../lib/logger';
import {
  getGlobalConfigFilePath,
  readConfigFile,
  parseConfig,
  buildConfigFromEnvironment,
  writeConfigFile,
  getLocalConfigFileDefaultPath,
  getConfigAccountByIdentifier,
  isConfigAccountValid,
  getConfigAccountIndexById,
} from './configUtils';
import { CMS_PUBLISH_MODE } from '../constants/files';

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
    if (!isConfigAccountValid(account)) {
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
    'accountId',
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
  if (!isConfigAccountValid(accountToAdd)) {
    throw new Error('@TODO');
  }

  const config = getConfig(configFilePath, false);

  const accountInConfig = getConfigAccountByIdentifier(
    config.accounts,
    'accountId',
    accountToAdd.accountId
  );

  if (accountInConfig) {
    throw new Error('@TODO account already exists');
  }

  config.accounts.push(accountToAdd);

  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

export function updateConfigAccount(
  configFilePath: string | null,
  updatedAccount: HubSpotConfigAccount
): void {
  if (!isConfigAccountValid(updatedAccount)) {
    throw new Error('@TODO');
  }

  const config = getConfig(configFilePath, false);

  const accountIndex = getConfigAccountIndexById(
    config.accounts,
    updatedAccount.accountId
  );

  if (accountIndex < 0) {
    throw new Error('@TODO account not found');
  }

  config.accounts[accountIndex] = updatedAccount;

  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

export function setConfigAccountAsDefault(
  configFilePath: string | null,
  accountIdentifier: number | string
): void {
  const config = getConfig(configFilePath, false);

  const identifierAsNumber =
    typeof accountIdentifier === 'number'
      ? accountIdentifier
      : parseInt(accountIdentifier);
  const isId = !isNaN(identifierAsNumber);

  const account = getConfigAccountByIdentifier(
    config.accounts,
    isId ? 'accountId' : 'name',
    isId ? identifierAsNumber : accountIdentifier
  );

  if (!account) {
    throw new Error('@TODO account not found');
  }

  config.defaultAccount = account.accountId;
  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

export function renameConfigAccount(
  configFilePath: string | null,
  currentName: string,
  newName: string
): void {
  const config = getConfig(configFilePath, false);

  const account = getConfigAccountByIdentifier(
    config.accounts,
    'name',
    currentName
  );

  if (!account) {
    throw new Error('@TODO account not found');
  }

  const duplicateAccount = getConfigAccountByIdentifier(
    config.accounts,
    'name',
    newName
  );

  if (duplicateAccount) {
    throw new Error('@TODO account name already exists');
  }

  account.name = newName;

  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

export function removeAccountFromConfig(
  configFilePath: string | null,
  accountId: number
): void {
  const config = getConfig(configFilePath, false);

  const index = getConfigAccountIndexById(config.accounts, accountId);

  if (index < 0) {
    throw new Error('@TODO account does not exist');
  }

  config.accounts.splice(index, 1);

  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

export function updateHttpTimeout(
  configFilePath: string | null,
  timeout: string | number
): void {
  const parsedTimeout =
    typeof timeout === 'string' ? parseInt(timeout) : timeout;

  if (isNaN(parsedTimeout) || parsedTimeout < MIN_HTTP_TIMEOUT) {
    throw new Error('@TODO timeout must be greater than min');
  }

  const config = getConfig(configFilePath, false);

  config.httpTimeout = parsedTimeout;

  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

export function updateAllowUsageTracking(
  configFilePath: string | null,
  isAllowed: boolean
): void {
  const config = getConfig(configFilePath, false);

  config.allowUsageTracking = isAllowed;

  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

export function updateDefaultCmsPublishMode(
  configFilePath: string | null,
  cmsPublishMode: CmsPublishMode
): void {
  if (
    !cmsPublishMode ||
    !Object.values(CMS_PUBLISH_MODE).includes(cmsPublishMode)
  ) {
    throw new Error('@TODO invalid CMS publihs mode');
  }

  const config = getConfig(configFilePath, false);

  config.defaultCmsPublishMode = cmsPublishMode;

  writeConfigFile(config, configFilePath || getDefaultConfigFilePath());
}

export function isConfigFlagEnabled(
  configFilePath: string | null,
  flag: ConfigFlag,
  defaultValue: boolean
): boolean {
  const config = getConfig(configFilePath, false);

  if (typeof config[flag] === 'undefined') {
    return defaultValue;
  }

  return Boolean(config[flag]);
}
