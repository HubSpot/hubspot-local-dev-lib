import fs from 'fs-extra';

import { MIN_HTTP_TIMEOUT } from '../constants/config';
import { HubSpotConfigAccount } from '../types/Accounts';
import { HubSpotConfig, ConfigFlag } from '../types/Config';
import { CmsPublishMode } from '../types/Files';
import { logger } from '../lib/logger';
import {
  getGlobalConfigFilePath,
  getLocalConfigFilePath,
  readConfigFile,
  parseConfig,
  buildConfigFromEnvironment,
  writeConfigFile,
  getLocalConfigFileDefaultPath,
  getConfigAccountByIdentifier,
  isConfigAccountValid,
  getConfigAccountIndexById,
  getConfigPathEnvironmentVariables,
  getConfigAccountByInferredIdentifier,
} from './utils';
import { CMS_PUBLISH_MODE } from '../constants/files';
import { Environment } from '../types/Config';

export function localConfigFileExists(): boolean {
  return Boolean(getLocalConfigFilePath());
}

export function globalConfigFileExists(): boolean {
  return fs.existsSync(getGlobalConfigFilePath());
}

function getDefaultConfigFilePath(): string {
  const globalConfigFilePath = getGlobalConfigFilePath();

  if (fs.existsSync(globalConfigFilePath)) {
    return globalConfigFilePath;
  }

  const localConfigFilePath = getLocalConfigFilePath();

  if (!localConfigFilePath) {
    throw new Error('@TODO');
  }

  return localConfigFilePath;
}

export function getConfigFilePath(): string {
  const { configFilePathFromEnvironment } = getConfigPathEnvironmentVariables();

  return configFilePathFromEnvironment || getDefaultConfigFilePath();
}

export function getConfig(): HubSpotConfig {
  const { useEnvironmentConfig } = getConfigPathEnvironmentVariables();

  if (useEnvironmentConfig) {
    return buildConfigFromEnvironment();
  }

  const pathToRead = getConfigFilePath();

  logger.debug(`@TODOReading config from ${pathToRead}`);
  const configFileSource = readConfigFile(pathToRead);

  return parseConfig(configFileSource);
}

export function isConfigValid(): boolean {
  const config = getConfig();

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

export function createEmptyConfigFile(useGlobalConfig = false): void {
  const { configFilePathFromEnvironment } = getConfigPathEnvironmentVariables();
  const defaultPath = useGlobalConfig
    ? getGlobalConfigFilePath()
    : getLocalConfigFileDefaultPath();

  const pathToWrite = configFilePathFromEnvironment || defaultPath;

  writeConfigFile({ accounts: [] }, pathToWrite);
}

export function deleteConfigFile(): void {
  const pathToDelete = getConfigFilePath();
  fs.unlinkSync(pathToDelete);
}

export function getConfigAccountById(accountId: number): HubSpotConfigAccount {
  const { accounts } = getConfig();

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
  accountName: string
): HubSpotConfigAccount {
  const { accounts } = getConfig();

  const account = getConfigAccountByIdentifier(accounts, 'name', accountName);

  if (!account) {
    throw new Error('@TODO account not found');
  }

  return account;
}

export function getConfigDefaultAccount(): HubSpotConfigAccount {
  const { accounts, defaultAccount } = getConfig();

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

export function getAllConfigAccounts(): HubSpotConfigAccount[] {
  const { accounts } = getConfig();

  return accounts;
}

export function getConfigAccountEnvironment(
  identifier?: number | string
): Environment {
  if (identifier) {
    const config = getConfig();

    const account = getConfigAccountByInferredIdentifier(
      config.accounts,
      identifier
    );

    if (account) {
      return account.env;
    }
  }
  const defaultAccount = getConfigDefaultAccount();
  return defaultAccount.env;
}

// @TODO: Add logger debugs?
export function addConfigAccount(accountToAdd: HubSpotConfigAccount): void {
  if (!isConfigAccountValid(accountToAdd)) {
    throw new Error('@TODO');
  }

  const config = getConfig();

  const accountInConfig = getConfigAccountByIdentifier(
    config.accounts,
    'accountId',
    accountToAdd.accountId
  );

  if (accountInConfig) {
    throw new Error('@TODO account already exists');
  }

  config.accounts.push(accountToAdd);

  writeConfigFile(config, getConfigFilePath());
}

export function updateConfigAccount(
  updatedAccount: HubSpotConfigAccount
): void {
  if (!isConfigAccountValid(updatedAccount)) {
    throw new Error('@TODO');
  }

  const config = getConfig();

  const accountIndex = getConfigAccountIndexById(
    config.accounts,
    updatedAccount.accountId
  );

  if (accountIndex < 0) {
    throw new Error('@TODO account not found');
  }

  config.accounts[accountIndex] = updatedAccount;

  writeConfigFile(config, getConfigFilePath());
}

export function setConfigAccountAsDefault(identifier: number | string): void {
  const config = getConfig();

  const account = getConfigAccountByInferredIdentifier(
    config.accounts,
    identifier
  );

  if (!account) {
    throw new Error('@TODO account not found');
  }

  config.defaultAccount = account.accountId;
  writeConfigFile(config, getConfigFilePath());
}

export function renameConfigAccount(
  currentName: string,
  newName: string
): void {
  const config = getConfig();

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

  writeConfigFile(config, getConfigFilePath());
}

export function removeAccountFromConfig(accountId: number): void {
  const config = getConfig();

  const index = getConfigAccountIndexById(config.accounts, accountId);

  if (index < 0) {
    throw new Error('@TODO account does not exist');
  }

  config.accounts.splice(index, 1);

  if (config.defaultAccount === accountId) {
    delete config.defaultAccount;
  }

  writeConfigFile(config, getConfigFilePath());
}

export function updateHttpTimeout(timeout: string | number): void {
  const parsedTimeout =
    typeof timeout === 'string' ? parseInt(timeout) : timeout;

  if (isNaN(parsedTimeout) || parsedTimeout < MIN_HTTP_TIMEOUT) {
    throw new Error('@TODO timeout must be greater than min');
  }

  const config = getConfig();

  config.httpTimeout = parsedTimeout;

  writeConfigFile(config, getConfigFilePath());
}

export function updateAllowUsageTracking(isAllowed: boolean): void {
  const config = getConfig();

  config.allowUsageTracking = isAllowed;

  writeConfigFile(config, getConfigFilePath());
}

export function updateDefaultCmsPublishMode(
  cmsPublishMode: CmsPublishMode
): void {
  if (
    !cmsPublishMode ||
    !Object.values(CMS_PUBLISH_MODE).includes(cmsPublishMode)
  ) {
    throw new Error('@TODO invalid CMS publihs mode');
  }

  const config = getConfig();

  config.defaultCmsPublishMode = cmsPublishMode;

  writeConfigFile(config, getConfigFilePath());
}

export function isConfigFlagEnabled(
  flag: ConfigFlag,
  defaultValue?: boolean
): boolean {
  const config = getConfig();

  if (typeof config[flag] === 'undefined') {
    return defaultValue || false;
  }

  return Boolean(config[flag]);
}
