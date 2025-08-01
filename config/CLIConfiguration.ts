import fs from 'fs';
import findup from 'findup-sync';
import { getCwd } from '../lib/path';
import { logger } from '../lib/logger';
import { loadConfigFromEnvironment } from './environment';
import { getValidEnv } from '../lib/environment';
import {
  loadConfigFromFile,
  writeConfigToFile,
  configFileExists,
  configFileIsBlank,
  deleteConfigFile,
} from './configFile';
import { commaSeparatedValues } from '../lib/text';
import { ENVIRONMENTS } from '../constants/environments';
import { API_KEY_AUTH_METHOD } from '../constants/auth';
import {
  HUBSPOT_ACCOUNT_TYPES,
  MIN_HTTP_TIMEOUT,
  DEFAULT_ACCOUNT_OVERRIDE_FILE_NAME,
  DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID,
  DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND,
} from '../constants/config';
import { CMS_PUBLISH_MODE } from '../constants/files';
import { CLIConfig_NEW, Environment } from '../types/Config';
import {
  CLIAccount_NEW,
  OAuthAccount_NEW,
  FlatAccountFields_NEW,
  AccountType,
} from '../types/Accounts';
import { CLIOptions } from '../types/CLIOptions';
import { i18n } from '../utils/lang';
import { CmsPublishMode } from '../types/Files';

const i18nKey = 'config.cliConfiguration';

class _CLIConfiguration {
  options: CLIOptions;
  useEnvConfig: boolean;
  config: CLIConfig_NEW | null;
  active: boolean;

  constructor() {
    this.options = {};
    this.useEnvConfig = false;
    this.config = null;
    this.active = false;
  }

  setActive(isActive: boolean): void {
    this.active = isActive;
  }

  isActive(): boolean {
    return this.active;
  }

  init(options: CLIOptions = {}): CLIConfig_NEW | null {
    this.options = options;
    this.load();
    this.setActive(true);
    return this.config;
  }

  load(): CLIConfig_NEW | null {
    if (this.options.useEnv) {
      const configFromEnv = loadConfigFromEnvironment();
      if (configFromEnv) {
        logger.debug(
          i18n(`${i18nKey}.load.configFromEnv`, {
            accountId: configFromEnv.accounts[0].accountId,
          })
        );
        this.useEnvConfig = true;
        this.config = this.handleLegacyCmsPublishMode(configFromEnv);
      }
    } else {
      const configFromFile = loadConfigFromFile();
      logger.debug(i18n(`${i18nKey}.load.configFromFile`));

      if (!configFromFile) {
        logger.debug(i18n(`${i18nKey}.load.empty`));
        this.config = { accounts: [] };
      }
      this.useEnvConfig = false;
      this.config = this.handleLegacyCmsPublishMode(configFromFile);
    }

    return this.config;
  }

  configIsEmpty(): boolean {
    if (!configFileExists() || configFileIsBlank()) {
      return true;
    } else {
      this.load();
      if (
        !!this.config &&
        Object.keys(this.config).length === 1 &&
        !!this.config.accounts
      ) {
        return true;
      }
    }
    return false;
  }

  delete(): void {
    if (!this.useEnvConfig && this.configIsEmpty()) {
      deleteConfigFile();
      this.config = null;
    }
  }

  write(updatedConfig?: CLIConfig_NEW): CLIConfig_NEW | null {
    if (!this.useEnvConfig) {
      if (updatedConfig) {
        this.config = updatedConfig;
      }
      if (this.config) {
        writeConfigToFile(this.config);
      }
    }
    return this.config;
  }

  validate(): boolean {
    if (!this.config) {
      logger.log(i18n(`${i18nKey}.validate.noConfig`));
      return false;
    }
    if (!Array.isArray(this.config.accounts)) {
      logger.log(i18n(`${i18nKey}.validate.noConfigAccounts`));
      return false;
    }

    const accountIdsMap: { [key: number]: boolean } = {};
    const accountNamesMap: { [key: string]: boolean } = {};

    return this.config.accounts.every(accountConfig => {
      if (!accountConfig) {
        logger.log(i18n(`${i18nKey}.validate.emptyAccountConfig`));
        return false;
      }
      if (!accountConfig.accountId) {
        logger.log(i18n(`${i18nKey}.validate.noAccountId`));
        return false;
      }
      if (accountIdsMap[accountConfig.accountId]) {
        logger.log(
          i18n(`${i18nKey}.validate.duplicateAccountIds`, {
            accountId: accountConfig.accountId,
          })
        );
        return false;
      }
      if (accountConfig.name) {
        if (accountNamesMap[accountConfig.name.toLowerCase()]) {
          logger.log(
            i18n(`${i18nKey}.validate.duplicateAccountNames`, {
              accountName: accountConfig.name,
            })
          );
          return false;
        }
        if (/\s+/.test(accountConfig.name)) {
          logger.log(
            i18n(`${i18nKey}.validate.nameContainsSpaces`, {
              accountName: accountConfig.name,
            })
          );
          return false;
        }
        accountNamesMap[accountConfig.name] = true;
      }
      if (!accountConfig.accountType) {
        this.addOrUpdateAccount({
          ...accountConfig,
          accountId: accountConfig.accountId,
          accountType: this.getAccountType(
            undefined,
            accountConfig.sandboxAccountType
          ),
        });
      }

      accountIdsMap[accountConfig.accountId] = true;
      return true;
    });
  }

  getAccount(nameOrId: string | number | undefined): CLIAccount_NEW | null {
    let name: string | null = null;
    let accountId: number | null = null;

    if (!this.config) {
      return null;
    }

    const nameOrIdToCheck = nameOrId ? nameOrId : this.getDefaultAccount();

    if (!nameOrIdToCheck) {
      return null;
    }

    if (typeof nameOrIdToCheck === 'string') {
      name = nameOrIdToCheck;
      if (/^\d+$/.test(nameOrIdToCheck)) {
        accountId = parseInt(nameOrIdToCheck, 10);
      }
    } else if (typeof nameOrIdToCheck === 'number') {
      accountId = nameOrIdToCheck;
    }

    let account: CLIAccount_NEW | null = null;
    if (name) {
      account = this.config.accounts.find(a => a.name === name) || null;
    }

    if (accountId && !account) {
      account =
        this.config.accounts.find(a => accountId === a.accountId) || null;
    }

    return account;
  }

  isConfigFlagEnabled(
    flag: keyof CLIConfig_NEW,
    defaultValue = false
  ): boolean {
    if (this.config && typeof this.config[flag] !== 'undefined') {
      return Boolean(this.config[flag]);
    }
    return defaultValue;
  }

  getAccountId(nameOrId?: string | number): number | null {
    const account = this.getAccount(nameOrId);
    return account ? account.accountId : null;
  }

  getDefaultAccount(): string | number | null {
    return this.getCWDAccountOverride() || this.config?.defaultAccount || null;
  }

  getDefaultAccountOverrideFilePath(): string | null {
    return findup([DEFAULT_ACCOUNT_OVERRIDE_FILE_NAME], {
      cwd: getCwd(),
    });
  }

  getCWDAccountOverride(): string | number | null {
    const defaultOverrideFile = this.getDefaultAccountOverrideFilePath();
    if (!defaultOverrideFile) {
      return null;
    }

    let source: string;
    try {
      source = fs.readFileSync(defaultOverrideFile, 'utf8');
    } catch (e) {
      if (e instanceof Error) {
        logger.error(
          i18n(`${i18nKey}.getCWDAccountOverride.readFileError`, {
            error: e.message,
          })
        );
      }
      return null;
    }

    const accountId = Number(source);

    if (isNaN(accountId)) {
      throw new Error(
        i18n(`${i18nKey}.getCWDAccountOverride.errorHeader`, {
          hsAccountFile: defaultOverrideFile,
        }),
        {
          cause: DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID,
        }
      );
    }

    const account = this.config?.accounts?.find(
      account => account.accountId === accountId
    );
    if (!account) {
      throw new Error(
        i18n(`${i18nKey}.getCWDAccountOverride.errorHeader`, {
          hsAccountFile: defaultOverrideFile,
        }),
        {
          cause: DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND,
        }
      );
    }

    return account.name || account.accountId;
  }

  getAccountIndex(accountId: number): number {
    return this.config
      ? this.config.accounts.findIndex(
          account => account.accountId === accountId
        )
      : -1;
  }

  getConfigAccounts(): Array<CLIAccount_NEW> | null {
    if (this.config) {
      return this.config.accounts || null;
    }
    return null;
  }

  isAccountInConfig(nameOrId: string | number): boolean {
    if (typeof nameOrId === 'string') {
      return (
        !!this.config &&
        this.config.accounts &&
        !!this.getAccountId(nameOrId.toLowerCase())
      );
    }
    return (
      !!this.config && this.config.accounts && !!this.getAccountId(nameOrId)
    );
  }

  getAndLoadConfigIfNeeded(options?: CLIOptions): CLIConfig_NEW {
    if (!this.config) {
      this.init(options);
    }
    return this.config!;
  }

  getEnv(nameOrId?: string | number): Environment {
    const accountConfig = this.getAccount(nameOrId);

    if (accountConfig && accountConfig.accountId && accountConfig.env) {
      return accountConfig.env;
    }
    if (this.config && this.config.env) {
      return this.config.env;
    }
    return ENVIRONMENTS.PROD;
  }

  // Deprecating sandboxAccountType in favor of accountType
  getAccountType(
    accountType?: AccountType | null,
    sandboxAccountType?: string | null
  ): AccountType {
    if (accountType) {
      return accountType;
    }
    if (typeof sandboxAccountType === 'string') {
      if (sandboxAccountType.toUpperCase() === 'DEVELOPER') {
        return HUBSPOT_ACCOUNT_TYPES.DEVELOPMENT_SANDBOX;
      }
      if (sandboxAccountType.toUpperCase() === 'STANDARD') {
        return HUBSPOT_ACCOUNT_TYPES.STANDARD_SANDBOX;
      }
    }
    return HUBSPOT_ACCOUNT_TYPES.STANDARD;
  }

  /*
   * Config Update Utils
   */

  /**
   * @throws {Error}
   */
  addOrUpdateAccount(
    updatedAccountFields: Partial<FlatAccountFields_NEW>,
    writeUpdate = true
  ): FlatAccountFields_NEW | null {
    const {
      accountId,
      accountType,
      apiKey,
      authType,
      clientId,
      clientSecret,
      defaultCmsPublishMode,
      env,
      name,
      parentAccountId,
      personalAccessKey,
      sandboxAccountType,
      scopes,
      tokenInfo,
    } = updatedAccountFields;

    if (!accountId) {
      throw new Error(
        i18n(`${i18nKey}.updateAccount.errors.accountIdRequired`)
      );
    }
    if (!this.config) {
      logger.debug(i18n(`${i18nKey}.updateAccount.noConfigToUpdate`));
      return null;
    }

    // Check whether the account is already listed in the config.yml file.
    const currentAccountConfig = this.getAccount(accountId);

    // For accounts that are already in the config.yml file, sets the auth property.
    let auth: OAuthAccount_NEW['auth'] =
      (currentAccountConfig && currentAccountConfig.auth) || {};
    // For accounts not already in the config.yml file, sets the auth property.
    if (clientId || clientSecret || scopes || tokenInfo) {
      auth = {
        ...(currentAccountConfig ? currentAccountConfig.auth : {}),
        clientId,
        clientSecret,
        scopes,
        tokenInfo,
      };
    }

    const nextAccountConfig: Partial<FlatAccountFields_NEW> = {
      ...(currentAccountConfig ? currentAccountConfig : {}),
    };

    // Allow everything except for 'undefined' values to override the existing values
    function safelyApplyUpdates<T extends keyof FlatAccountFields_NEW>(
      fieldName: T,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newValue: FlatAccountFields_NEW[T]
    ) {
      if (typeof newValue !== 'undefined') {
        nextAccountConfig[fieldName] = newValue;
      }
    }

    const updatedEnv = getValidEnv(
      env || (currentAccountConfig && currentAccountConfig.env)
    );
    const updatedDefaultCmsPublishMode: CmsPublishMode | undefined =
      defaultCmsPublishMode &&
      (defaultCmsPublishMode.toLowerCase() as CmsPublishMode);
    const updatedAccountType =
      accountType || (currentAccountConfig && currentAccountConfig.accountType);

    safelyApplyUpdates('name', name);
    safelyApplyUpdates('env', updatedEnv);
    safelyApplyUpdates('accountId', accountId);
    safelyApplyUpdates('authType', authType);
    safelyApplyUpdates('auth', auth);
    if (nextAccountConfig.authType === API_KEY_AUTH_METHOD.value) {
      safelyApplyUpdates('apiKey', apiKey);
    }
    if (typeof updatedDefaultCmsPublishMode !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      safelyApplyUpdates(
        'defaultCmsPublishMode',
        CMS_PUBLISH_MODE[updatedDefaultCmsPublishMode]
      );
    }
    safelyApplyUpdates('personalAccessKey', personalAccessKey);

    // Deprecating sandboxAccountType in favor of the more generic accountType
    safelyApplyUpdates('sandboxAccountType', sandboxAccountType);
    safelyApplyUpdates(
      'accountType',
      this.getAccountType(updatedAccountType, sandboxAccountType)
    );

    safelyApplyUpdates('parentAccountId', parentAccountId);

    const completedAccountConfig = nextAccountConfig as FlatAccountFields_NEW;
    if (!Object.hasOwn(this.config, 'accounts')) {
      this.config.accounts = [];
    }
    if (currentAccountConfig) {
      logger.debug(
        i18n(`${i18nKey}.updateAccount.updating`, {
          accountId,
        })
      );
      const index = this.getAccountIndex(accountId);
      if (index < 0) {
        this.config.accounts.push(completedAccountConfig);
      } else {
        this.config.accounts[index] = completedAccountConfig;
      }
      logger.debug(
        i18n(`${i18nKey}.updateAccount.addingConfigEntry`, {
          accountId,
        })
      );
    } else {
      this.config.accounts.push(completedAccountConfig);
    }

    if (writeUpdate) {
      this.write();
    }

    return completedAccountConfig;
  }

  /**
   * @throws {Error}
   */
  updateDefaultAccount(defaultAccount: string | number): CLIConfig_NEW | null {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }
    if (
      !defaultAccount ||
      (typeof defaultAccount !== 'number' && typeof defaultAccount !== 'string')
    ) {
      throw new Error(
        i18n(`${i18nKey}.updateDefaultAccount.errors.invalidInput`)
      );
    }

    this.config.defaultAccount = defaultAccount;
    return this.write();
  }

  /**
   * @throws {Error}
   */
  renameAccount(currentName: string, newName: string): void {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }
    const accountId = this.getAccountId(currentName);
    let accountConfigToRename: CLIAccount_NEW | null = null;

    if (accountId) {
      accountConfigToRename = this.getAccount(accountId);
    }

    if (!accountConfigToRename) {
      throw new Error(
        i18n(`${i18nKey}.renameAccount.errors.invalidName`, {
          currentName,
        })
      );
    }

    if (accountId) {
      this.addOrUpdateAccount({
        accountId,
        name: newName,
        env: this.getEnv(),
        accountType: accountConfigToRename.accountType,
      });
    }

    if (accountConfigToRename.name === this.getDefaultAccount()) {
      this.updateDefaultAccount(newName);
    }
  }

  /**
   * @throws {Error}
   * TODO: this does not account for the special handling of sandbox account deletes
   */
  removeAccountFromConfig(nameOrId: string | number): boolean {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }
    const accountId = this.getAccountId(nameOrId);

    if (!accountId) {
      throw new Error(
        i18n(`${i18nKey}.removeAccountFromConfig.errors.invalidId`, {
          nameOrId,
        })
      );
    }

    let removedAccountIsDefault = false;
    const accountConfig = this.getAccount(accountId);

    if (accountConfig) {
      logger.debug(
        i18n(`${i18nKey}.removeAccountFromConfig.deleting`, { accountId })
      );
      const index = this.getAccountIndex(accountId);
      this.config.accounts.splice(index, 1);

      if (this.getDefaultAccount() === accountConfig.name) {
        removedAccountIsDefault = true;
      }

      this.write();
    }

    return removedAccountIsDefault;
  }

  /**
   * @throws {Error}
   */
  updateDefaultCmsPublishMode(
    defaultCmsPublishMode: CmsPublishMode
  ): CLIConfig_NEW | null {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }
    const ALL_CMS_PUBLISH_MODES = Object.values(CMS_PUBLISH_MODE);
    if (
      !defaultCmsPublishMode ||
      !ALL_CMS_PUBLISH_MODES.find(m => m === defaultCmsPublishMode)
    ) {
      throw new Error(
        i18n(
          `${i18nKey}.updateDefaultCmsPublishMode.errors.invalidCmsPublishMode`,
          {
            defaultCmsPublishMode,
            validCmsPublishModes: commaSeparatedValues(ALL_CMS_PUBLISH_MODES),
          }
        )
      );
    }

    this.config.defaultCmsPublishMode = defaultCmsPublishMode;
    return this.write();
  }

  /**
   * @throws {Error}
   */
  updateHttpTimeout(timeout: string): CLIConfig_NEW | null {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }
    const parsedTimeout = parseInt(timeout);
    if (isNaN(parsedTimeout) || parsedTimeout < MIN_HTTP_TIMEOUT) {
      throw new Error(
        i18n(`${i18nKey}.updateHttpTimeout.errors.invalidTimeout`, {
          timeout,
          minTimeout: MIN_HTTP_TIMEOUT,
        })
      );
    }

    this.config.httpTimeout = parsedTimeout;
    return this.write();
  }

  /**
   * @throws {Error}
   */
  updateAllowAutoUpdates(enabled: boolean): CLIConfig_NEW | null {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }

    this.config.allowAutoUpdates = enabled;
    return this.write();
  }

  /**
   * @throws {Error}
   */
  updateAllowUsageTracking(isEnabled: boolean): CLIConfig_NEW | null {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }
    if (typeof isEnabled !== 'boolean') {
      throw new Error(
        i18n(`${i18nKey}.updateAllowUsageTracking.errors.invalidInput`, {
          isEnabled: `${isEnabled}`,
        })
      );
    }

    this.config.allowUsageTracking = isEnabled;
    return this.write();
  }

  updateAutoOpenBrowser(isEnabled: boolean): CLIConfig_NEW | null {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }

    if (typeof isEnabled !== 'boolean') {
      throw new Error(
        i18n(`${i18nKey}.updateAutoOpenBrowser.errors.invalidInput`, {
          isEnabled: `${isEnabled}`,
        })
      );
    }

    this.config.autoOpenBrowser = isEnabled;
    return this.write();
  }

  isTrackingAllowed(): boolean {
    if (!this.config) {
      return true;
    }
    return this.config.allowUsageTracking !== false;
  }

  handleLegacyCmsPublishMode(
    config: CLIConfig_NEW | null
  ): CLIConfig_NEW | null {
    if (config?.defaultMode) {
      config.defaultCmsPublishMode = config.defaultMode;
      delete config.defaultMode;
    }
    return config;
  }

  hasLocalStateFlag(flag: string): boolean {
    if (!this.config) {
      return false;
    }

    return this.config.flags?.includes(flag) || false;
  }

  addLocalStateFlag(flag: string): void {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }

    if (!this.hasLocalStateFlag(flag)) {
      this.config.flags = [...(this.config.flags || []), flag];
    }

    this.write();
  }

  removeLocalStateFlag(flag: string): void {
    if (!this.config) {
      throw new Error(i18n(`${i18nKey}.errors.noConfigLoaded`));
    }

    this.config.flags = this.config.flags?.filter(f => f !== flag) || [];

    this.write();
  }
}

export const CLIConfiguration = new _CLIConfiguration();
