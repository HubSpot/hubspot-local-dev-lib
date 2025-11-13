import fs from 'fs-extra';

import {
  ACCOUNT_IDENTIFIERS,
  ENVIRONMENT_VARIABLES,
  HUBSPOT_CONFIG_OPERATIONS,
  MIN_HTTP_TIMEOUT,
} from '../constants/config';
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
import { getValidEnv } from '../lib/environment';
import { HubSpotConfigError } from '../models/HubSpotConfigError';
import { HUBSPOT_CONFIG_ERROR_TYPES } from '../constants/config';

export function localConfigFileExists(): boolean {
  return Boolean(getLocalConfigFilePath());
}

export function globalConfigFileExists(): boolean {
  return fs.existsSync(getGlobalConfigFilePath());
}

export function configFileExists(): boolean {
  try {
    return fs.existsSync(getConfigFilePath());
  } catch (error) {
    return false;
  }
}

function getConfigDefaultFilePath(): string {
  const globalConfigFilePath = getGlobalConfigFilePath();

  if (fs.existsSync(globalConfigFilePath)) {
    return globalConfigFilePath;
  }

  const localConfigFilePath = getLocalConfigFilePath();

  if (!localConfigFilePath) {
    throw new HubSpotConfigError(
      i18n('config.getDefaultConfigFilePath.error'),
      HUBSPOT_CONFIG_ERROR_TYPES.CONFIG_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.READ
    );
  }

  return localConfigFilePath;
}

export function getConfigFilePath(): string {
  const { configFilePathFromEnvironment } = getConfigPathEnvironmentVariables();

  return configFilePathFromEnvironment || getConfigDefaultFilePath();
}

export function getConfig(): HubSpotConfig {
  let pathToRead: string | undefined;
  try {
    const { useEnvironmentConfig } = getConfigPathEnvironmentVariables();

    if (useEnvironmentConfig) {
      return buildConfigFromEnvironment();
    }

    pathToRead = getConfigFilePath();

    logger.debug(i18n('config.getConfig.reading', { path: pathToRead }));
    const configFileSource = readConfigFile(pathToRead);

    return parseConfig(configFileSource, pathToRead);
  } catch (err) {
    throw new HubSpotConfigError(
      pathToRead
        ? i18n('config.getConfig.errorWithPath', { path: pathToRead })
        : i18n('config.getConfig.error'),
      HUBSPOT_CONFIG_ERROR_TYPES.CONFIG_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.READ,
      { cause: err }
    );
  }
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
    throw new HubSpotConfigError(
      i18n('config.getConfigAccountById.error', { accountId }),
      HUBSPOT_CONFIG_ERROR_TYPES.ACCOUNT_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.READ
    );
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
    throw new HubSpotConfigError(
      i18n('config.getConfigAccountByName.error', { accountName }),
      HUBSPOT_CONFIG_ERROR_TYPES.ACCOUNT_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.READ
    );
  }

  return account;
}

export function getConfigAccountIfExists(
  identifier: number | string
): HubSpotConfigAccount | undefined {
  const config = getConfig();
  return getConfigAccountByInferredIdentifier(config.accounts, identifier);
}

export function getConfigDefaultAccount(): HubSpotConfigAccount {
  const { accounts, defaultAccount } = getConfig();

  let defaultAccountToUse = defaultAccount;

  const currentConfigPath = getConfigFilePath();
  const globalConfigPath = getGlobalConfigFilePath();
  if (currentConfigPath === globalConfigPath && globalConfigFileExists()) {
    const defaultAccountOverrideAccountId =
      getDefaultAccountOverrideAccountId();
    defaultAccountToUse = defaultAccountOverrideAccountId || defaultAccount;
  }

  if (!defaultAccountToUse) {
    throw new HubSpotConfigError(
      i18n('config.getConfigDefaultAccount.fieldMissingError'),
      HUBSPOT_CONFIG_ERROR_TYPES.NO_DEFAULT_ACCOUNT,
      HUBSPOT_CONFIG_OPERATIONS.READ
    );
  }

  const account = getConfigAccountByInferredIdentifier(
    accounts,
    defaultAccountToUse
  );

  if (!account) {
    throw new HubSpotConfigError(
      i18n('config.getConfigDefaultAccount.accountMissingError', {
        defaultAccountToUse,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.ACCOUNT_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.READ
    );
  }

  return account;
}

export function getConfigDefaultAccountIfExists():
  | HubSpotConfigAccount
  | undefined {
  const { accounts, defaultAccount } = getConfig();

  let defaultAccountToUse = defaultAccount;

  // Only check for default account override if we're using the global config
  const currentConfigPath = getConfigFilePath();
  const globalConfigPath = getGlobalConfigFilePath();
  if (currentConfigPath === globalConfigPath && globalConfigFileExists()) {
    const defaultAccountOverrideAccountId =
      getDefaultAccountOverrideAccountId();
    defaultAccountToUse = defaultAccountOverrideAccountId || defaultAccount;
  }

  if (!defaultAccountToUse) {
    return;
  }

  const account = getConfigAccountByInferredIdentifier(
    accounts,
    defaultAccountToUse
  );

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
      return getValidEnv(account.env);
    }
  }
  const defaultAccount = getConfigDefaultAccount();
  return getValidEnv(defaultAccount.env);
}

export function addConfigAccount(accountToAdd: HubSpotConfigAccount): void {
  if (!isConfigAccountValid(accountToAdd)) {
    throw new HubSpotConfigError(
      i18n('config.addConfigAccount.invalidAccount'),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_ACCOUNT,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
    );
  }

  const config = getConfig();

  const accountInConfig = getConfigAccountByIdentifier(
    config.accounts,
    ACCOUNT_IDENTIFIERS.ACCOUNT_ID,
    accountToAdd.accountId
  );

  if (accountInConfig) {
    throw new HubSpotConfigError(
      i18n('config.addConfigAccount.duplicateAccount', {
        accountId: accountToAdd.accountId,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_ACCOUNT,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
    );
  }

  config.accounts.push(accountToAdd);

  writeConfigFile(config, getConfigFilePath());
}

export function updateConfigAccount(
  updatedAccount: HubSpotConfigAccount
): void {
  if (!isConfigAccountValid(updatedAccount)) {
    throw new HubSpotConfigError(
      i18n('config.updateConfigAccount.invalidAccount', {
        name: updatedAccount.name,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_ACCOUNT,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
    );
  }

  const config = getConfig();

  const accountIndex = getConfigAccountIndexById(
    config.accounts,
    updatedAccount.accountId
  );

  if (accountIndex < 0) {
    throw new HubSpotConfigError(
      i18n('config.updateConfigAccount.accountNotFound', {
        accountId: updatedAccount.accountId,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.ACCOUNT_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
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
    throw new HubSpotConfigError(
      i18n('config.setConfigAccountAsDefault.accountNotFound', {
        accountId: identifier,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.ACCOUNT_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
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
    throw new HubSpotConfigError(
      i18n('config.renameConfigAccount.accountNotFound', {
        currentName,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.ACCOUNT_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
    );
  }

  const duplicateAccount = getConfigAccountByIdentifier(
    config.accounts,
    ACCOUNT_IDENTIFIERS.NAME,
    newName
  );

  if (duplicateAccount) {
    throw new HubSpotConfigError(
      i18n('config.renameConfigAccount.duplicateAccount', {
        currentName,
        newName,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_ACCOUNT,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
    );
  }

  account.name = newName;

  writeConfigFile(config, getConfigFilePath());
}

export function removeAccountFromConfig(accountId: number): void {
  const config = getConfig();

  const index = getConfigAccountIndexById(config.accounts, accountId);

  if (index < 0) {
    throw new HubSpotConfigError(
      i18n('config.removeAccountFromConfig.accountNotFound', {
        accountId,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.ACCOUNT_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
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
    throw new HubSpotConfigError(
      i18n('config.updateHttpTimeout.invalidTimeout', {
        minTimeout: MIN_HTTP_TIMEOUT,
        timeout: parsedTimeout,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_FIELD,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
    );
  }

  const config = getConfig();

  config.httpTimeout = parsedTimeout;

  writeConfigFile(config, getConfigFilePath());
}

export function updateAllowUsageTracking(isAllowed: boolean): void {
  if (typeof isAllowed !== 'boolean') {
    throw new HubSpotConfigError(
      i18n('config.updateAllowUsageTracking.invalidInput', {
        isAllowed: `${isAllowed}`,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_FIELD,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
    );
  }

  const config = getConfig();

  config.allowUsageTracking = isAllowed;

  writeConfigFile(config, getConfigFilePath());
}

export function updateAllowAutoUpdates(isEnabled: boolean): void {
  if (typeof isEnabled !== 'boolean') {
    throw new HubSpotConfigError(
      i18n('config.updateAllowAutoUpdates.invalidInput', {
        isEnabled: `${isEnabled}`,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_FIELD,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
    );
  }
  const config = getConfig();

  config.allowAutoUpdates = isEnabled;

  writeConfigFile(config, getConfigFilePath());
}

export function updateAutoOpenBrowser(isEnabled: boolean): void {
  if (typeof isEnabled !== 'boolean') {
    throw new HubSpotConfigError(
      i18n('config.updateAutoOpenBrowser.invalidInput', {
        isEnabled: `${isEnabled}`,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_FIELD,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
    );
  }

  const config = getConfig();

  config.autoOpenBrowser = isEnabled;

  writeConfigFile(config, getConfigFilePath());
}

export function updateDefaultCmsPublishMode(
  cmsPublishMode: CmsPublishMode
): void {
  if (
    !cmsPublishMode ||
    !Object.values(CMS_PUBLISH_MODE).includes(cmsPublishMode)
  ) {
    throw new HubSpotConfigError(
      i18n('config.updateDefaultCmsPublishMode.invalidCmsPublishMode', {
        cmsPublishMode,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_FIELD,
      HUBSPOT_CONFIG_OPERATIONS.WRITE
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

export function hasLocalStateFlag(flag: string): boolean {
  const config = getConfig();

  return config.flags?.includes(flag) || false;
}

export function addLocalStateFlag(flag: string): void {
  const config = getConfig();

  if (!hasLocalStateFlag(flag)) {
    config.flags = [...(config.flags || []), flag];
  }

  writeConfigFile(config, getConfigFilePath());
}

export function removeLocalStateFlag(flag: string): void {
  const config = getConfig();

  config.flags = config.flags?.filter(f => f !== flag) || [];

  writeConfigFile(config, getConfigFilePath());
}
