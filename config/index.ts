import fs from 'fs-extra';
import findup from 'findup-sync';

import {
  ACCOUNT_IDENTIFIERS,
  DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
  GLOBAL_CONFIG_PATH,
  HUBSPOT_CONFIG_OPERATIONS,
  MIN_HTTP_TIMEOUT,
  ENVIRONMENT_VARIABLES,
} from '../constants/config.js';
import { HubSpotConfigAccount } from '../types/Accounts.js';
import {
  HubSpotConfig,
  ConfigFlag,
  HubSpotConfigValidationResult,
} from '../types/Config.js';
import { CmsPublishMode } from '../types/Files.js';
import { logger } from '../lib/logger.js';
import {
  readConfigFile,
  parseConfig,
  buildConfigFromEnvironment,
  writeConfigFile,
  getLocalConfigDefaultFilePath,
  getConfigAccountByIdentifier,
  validateConfigAccount,
  getConfigAccountIndexById,
  getConfigPathEnvironmentVariables,
  getConfigAccountByInferredIdentifier,
  handleConfigFileSystemError,
  doesConfigFileExistAtPath,
} from './utils.js';
import { CMS_PUBLISH_MODE } from '../constants/files.js';
import { Environment } from '../types/Accounts.js';
import { i18n } from '../utils/lang.js';
import { getDefaultAccountOverrideAccountId } from './defaultAccountOverride.js';
import { getValidEnv } from '../lib/environment.js';
import { HubSpotConfigError } from '../models/HubSpotConfigError.js';
import { HUBSPOT_CONFIG_ERROR_TYPES } from '../constants/config.js';
import { isDeepEqual } from '../lib/isDeepEqual.js';
import { getCwd } from '../lib/path.js';
import { getHsSettingsFile } from './hsSettings.js';

const EMPTY_CONFIG = { accounts: [] };

export function getGlobalConfigFilePath(): string {
  return GLOBAL_CONFIG_PATH;
}

export function getLocalConfigFilePathIfExists(cwd?: string): string | null {
  return findup(
    [
      DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
      DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME.replace('.yml', '.yaml'),
    ],
    { cwd: cwd || getCwd() }
  );
}

export function localConfigFileExists(): boolean {
  return Boolean(getLocalConfigFilePathIfExists());
}

export function globalConfigFileExists(): boolean {
  return doesConfigFileExistAtPath(getGlobalConfigFilePath());
}

export function configFileExists(): boolean {
  try {
    return doesConfigFileExistAtPath(getConfigFilePath());
  } catch (error) {
    return false;
  }
}

function getConfigDefaultFilePath(): string {
  const globalConfigFilePath = getGlobalConfigFilePath();

  if (doesConfigFileExistAtPath(globalConfigFilePath)) {
    return globalConfigFilePath;
  }

  const localConfigFilePath = getLocalConfigFilePathIfExists();

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

export function validateConfig(): HubSpotConfigValidationResult {
  const config = getConfig();

  if (config.accounts.length === 0) {
    return {
      isValid: false,
      errors: [i18n('config.validateConfig.missingAccounts')],
    };
  }

  const accountIdsMap: { [key: number]: boolean } = {};
  const accountNamesMap: { [key: string]: boolean } = {};

  const validationErrors: string[] = [];

  config.accounts.forEach(account => {
    const accountValidationResult = validateConfigAccount(account);
    if (!accountValidationResult.isValid) {
      validationErrors.push(...accountValidationResult.errors);
    }
    if (accountIdsMap[account.accountId]) {
      validationErrors.push(
        i18n('config.validateConfig.duplicateAccountIds', {
          accountId: account.accountId,
        })
      );
    }
    if (account.name) {
      if (accountNamesMap[account.name.toLowerCase()]) {
        validationErrors.push(
          i18n('config.validateConfig.duplicateAccountNames', {
            accountName: account.name,
          })
        );
      }
      if (/\s+/.test(account.name)) {
        validationErrors.push(
          i18n('config.validateConfig.invalidAccountName', {
            accountName: account.name,
          })
        );
      }
      accountNamesMap[account.name] = true;
    }

    accountIdsMap[account.accountId] = true;
  });

  return { isValid: validationErrors.length === 0, errors: validationErrors };
}

export function createEmptyConfigFile(useGlobalConfig = false): void {
  const { configFilePathFromEnvironment } = getConfigPathEnvironmentVariables();
  const defaultPath = useGlobalConfig
    ? getGlobalConfigFilePath()
    : getLocalConfigDefaultFilePath();

  const pathToWrite = configFilePathFromEnvironment || defaultPath;

  writeConfigFile(EMPTY_CONFIG, pathToWrite);
}

export function deleteConfigFileIfEmpty(): void {
  const pathToDelete = getConfigFilePath();

  try {
    const config = getConfig();

    if (isDeepEqual(config, EMPTY_CONFIG)) {
      fs.unlinkSync(pathToDelete);
    }
  } catch (error) {
    const { message, type } = handleConfigFileSystemError(error, pathToDelete);

    throw new HubSpotConfigError(
      message,
      type,
      HUBSPOT_CONFIG_OPERATIONS.DELETE,
      {
        cause: error,
      }
    );
  }
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
      getDefaultAccountOverrideAccountId(accounts);
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
      getDefaultAccountOverrideAccountId(accounts);
    defaultAccountToUse = defaultAccountOverrideAccountId || defaultAccount;
  }

  // Use the default account if .hs/settings.json is present
  const hsSettingsFile = getHsSettingsFile();
  if (hsSettingsFile && hsSettingsFile.localDefaultAccount) {
    defaultAccountToUse = hsSettingsFile.localDefaultAccount;
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

export function getAllConfigAccounts(
  showAll?: boolean
): HubSpotConfigAccount[] {
  let { accounts } = getConfig();

  // Show only accounts in the .hs/settings.json file
  if (!showAll) {
    const hsSettingsFile = getHsSettingsFile();
    accounts = accounts.filter(a =>
      hsSettingsFile ? hsSettingsFile.accounts.includes(a.accountId) : true
    );
  }

  return accounts;
}

export function getConfigAccountEnvironment(
  identifier: number | string
): Environment {
  const config = getConfig();

  const account = getConfigAccountByInferredIdentifier(
    config.accounts,
    identifier
  );

  if (!account) {
    throw new HubSpotConfigError(
      i18n('config.getConfigAccountEnvironment.accountNotFound', {
        identifier,
      }),
      HUBSPOT_CONFIG_ERROR_TYPES.ACCOUNT_NOT_FOUND,
      HUBSPOT_CONFIG_OPERATIONS.READ
    );
  }

  return getValidEnv(account.env);
}

export function addConfigAccount(accountToAdd: HubSpotConfigAccount): void {
  if (!validateConfigAccount(accountToAdd)) {
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
  // Skip updating the config file if we're using environment variables
  if (process.env[ENVIRONMENT_VARIABLES.USE_ENVIRONMENT_HUBSPOT_CONFIG]) {
    return;
  }
  if (!validateConfigAccount(updatedAccount)) {
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
        identifier,
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
