import fs from 'fs-extra';

import { ACCOUNT_IDENTIFIERS, MIN_HTTP_TIMEOUT } from '../constants/config';
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
  getLocalConfigDefaultFilePath,
  getConfigAccountByIdentifier,
  isConfigAccountValid,
  getConfigAccountIndexById,
  getConfigPathEnvironmentVariables,
  getConfigAccountByInferredIdentifier,
} from './utils';
import { CMS_PUBLISH_MODE } from '../constants/files';
import { Environment } from '../types/Config';
import { i18n } from '../utils/lang';
import { getDefaultAccountOverrideAccountId } from './defaultAccountOverride';

export function localConfigFileExists(): boolean {
  return Boolean(getLocalConfigFilePath());
}

export function globalConfigFileExists(): boolean {
  return fs.existsSync(getGlobalConfigFilePath());
}

function getConfigDefaultFilePath(): string {
  const globalConfigFilePath = getGlobalConfigFilePath();

  if (fs.existsSync(globalConfigFilePath)) {
    return globalConfigFilePath;
  }

  const localConfigFilePath = getLocalConfigFilePath();

  if (!localConfigFilePath) {
    throw new Error(i18n('config.getDefaultConfigFilePath.error'));
  }

  return localConfigFilePath;
}

export function getConfigFilePath(): string {
  const { configFilePathFromEnvironment } = getConfigPathEnvironmentVariables();

  return configFilePathFromEnvironment || getConfigDefaultFilePath();
}

export function getConfig(): HubSpotConfig {
  const { useEnvironmentConfig } = getConfigPathEnvironmentVariables();

  if (useEnvironmentConfig) {
    return buildConfigFromEnvironment();
  }

  const pathToRead = getConfigFilePath();

  logger.debug(i18n('config.getConfig', { path: pathToRead }));
  const configFileSource = readConfigFile(pathToRead);

  return parseConfig(configFileSource);
}

export function isConfigValid(): boolean {
  const config = getConfig();

  if (config.accounts.length === 0) {
    logger.debug(i18n('config.isConfigValid.missingAccounts'));
    return false;
  }

  const accountIdsMap: { [key: number]: boolean } = {};
  const accountNamesMap: { [key: string]: boolean } = {};

  return config.accounts.every(account => {
    if (!isConfigAccountValid(account)) {
      return false;
    }
    if (accountIdsMap[account.accountId]) {
      logger.debug(
        i18n('config.isConfigValid.duplicateAccountIds', {
          accountId: account.accountId,
        })
      );
      return false;
    }
    if (account.name) {
      if (accountNamesMap[account.name.toLowerCase()]) {
        logger.debug(
          i18n('config.isConfigValid.duplicateAccountNames', {
            accountName: account.name,
          })
        );
        return false;
      }
      if (/\s+/.test(account.name)) {
        logger.debug(
          i18n('config.isConfigValid.invalidAccountName', {
            accountName: account.name,
          })
        );
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
    : getLocalConfigDefaultFilePath();

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
    ACCOUNT_IDENTIFIERS.ACCOUNT_ID,
    accountId
  );

  if (!account) {
    throw new Error(i18n('config.getConfigAccountById.error', { accountId }));
  }

  return account;
}

export function getConfigAccountByName(
  accountName: string
): HubSpotConfigAccount {
  const { accounts } = getConfig();

  const account = getConfigAccountByIdentifier(
    accounts,
    ACCOUNT_IDENTIFIERS.NAME,
    accountName
  );

  if (!account) {
    throw new Error(
      i18n('config.getConfigAccountByName.error', { accountName })
    );
  }

  return account;
}

export function getConfigDefaultAccount(): HubSpotConfigAccount {
  const { accounts, defaultAccount } = getConfig();

  let defaultAccountToUse = defaultAccount;

  if (globalConfigFileExists()) {
    const defaultAccountOverrideAccountId =
      getDefaultAccountOverrideAccountId();
    defaultAccountToUse = defaultAccountOverrideAccountId || defaultAccount;
  }

  if (!defaultAccountToUse) {
    throw new Error(i18n('config.getConfigDefaultAccount.fieldMissingError'));
  }

  const account = getConfigAccountByInferredIdentifier(
    accounts,
    defaultAccountToUse
  );

  if (!account) {
    throw new Error(
      i18n('config.getConfigDefaultAccount.accountMissingError', {
        defaultAccountToUse,
      })
    );
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

export function addConfigAccount(accountToAdd: HubSpotConfigAccount): void {
  if (!isConfigAccountValid(accountToAdd)) {
    throw new Error(i18n('config.addConfigAccount.invalidAccount'));
  }

  const config = getConfig();

  const accountInConfig = getConfigAccountByIdentifier(
    config.accounts,
    ACCOUNT_IDENTIFIERS.ACCOUNT_ID,
    accountToAdd.accountId
  );

  if (accountInConfig) {
    throw new Error(
      i18n('config.addConfigAccount.duplicateAccount', {
        accountId: accountToAdd.accountId,
      })
    );
  }

  config.accounts.push(accountToAdd);

  writeConfigFile(config, getConfigFilePath());
}

export function updateConfigAccount(
  updatedAccount: HubSpotConfigAccount
): void {
  if (!isConfigAccountValid(updatedAccount)) {
    throw new Error(i18n('config.updateConfigAccount.invalidAccount'));
  }

  const config = getConfig();

  const accountIndex = getConfigAccountIndexById(
    config.accounts,
    updatedAccount.accountId
  );

  if (accountIndex < 0) {
    throw new Error(
      i18n('config.updateConfigAccount.accountNotFound', {
        accountId: updatedAccount.accountId,
      })
    );
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
    throw new Error(
      i18n('config.setConfigAccountAsDefault.accountNotFound', {
        accountId: identifier,
      })
    );
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
    ACCOUNT_IDENTIFIERS.NAME,
    currentName
  );

  if (!account) {
    throw new Error(
      i18n('config.renameConfigAccount.accountNotFound', {
        currentName,
      })
    );
  }

  const duplicateAccount = getConfigAccountByIdentifier(
    config.accounts,
    ACCOUNT_IDENTIFIERS.NAME,
    newName
  );

  if (duplicateAccount) {
    throw new Error(
      i18n('config.renameConfigAccount.duplicateAccount', {
        newName,
      })
    );
  }

  account.name = newName;

  writeConfigFile(config, getConfigFilePath());
}

export function removeAccountFromConfig(accountId: number): void {
  const config = getConfig();

  const index = getConfigAccountIndexById(config.accounts, accountId);

  if (index < 0) {
    throw new Error(
      i18n('config.removeAccountFromConfig.accountNotFound', {
        accountId,
      })
    );
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
    throw new Error(
      i18n('config.updateHttpTimeout.invalidTimeout', {
        minTimeout: MIN_HTTP_TIMEOUT,
      })
    );
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
    throw new Error(
      i18n('config.updateDefaultCmsPublishMode.invalidCmsPublishMode')
    );
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
