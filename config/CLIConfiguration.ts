import { logger } from '../lib/logger';
import { throwErrorWithMessage } from '../errors/standardErrors';
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
import { HUBSPOT_ACCOUNT_TYPES, MIN_HTTP_TIMEOUT } from '../constants/config';
import { MODE } from '../constants/files';
import { CLIConfig_NEW, Environment } from '../types/Config';
import {
  CLIAccount_NEW,
  OAuthAccount_NEW,
  FlatAccountFields_NEW,
  AccountType,
} from '../types/Accounts';
import { CLIOptions } from '../types/CLIOptions';
import { ValueOf } from '../types/Utils';
import { i18n } from '../utils/lang';

const i18nKey = 'config.cliConfiguration';

class CLIConfiguration {
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
        this.config = configFromEnv;
      }
    } else {
      const configFromFile = loadConfigFromFile();
      logger.debug(i18n(`${i18nKey}.load.configFromFile`));

      if (!configFromFile) {
        logger.debug(i18n(`${i18nKey}.load.empty`));
        this.config = { accounts: [] };
      }
      this.useEnvConfig = false;
      this.config = configFromFile;
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
        if (accountNamesMap[accountConfig.name]) {
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
        this.updateAccount({
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

    if (typeof nameOrIdToCheck === 'number') {
      accountId = nameOrIdToCheck;
    } else if (/^\d+$/.test(nameOrIdToCheck)) {
      accountId = parseInt(nameOrIdToCheck, 10);
    } else {
      name = nameOrIdToCheck;
    }

    if (name) {
      return this.config.accounts.find(a => a.name === name) || null;
    } else if (accountId) {
      return this.config.accounts.find(a => accountId === a.accountId) || null;
    }

    return null;
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
    return this.config && this.config.defaultAccount
      ? this.config.defaultAccount
      : null;
  }

  // TODO a util that returns the account to use, respecting the values set in
  // "defaultAccountOverrides"
  // Example "defaultAccountOverrides":
  //  - /src/brodgers/customer-project-1: customer-account1
  //  - /src/brodgers/customer-project-2: customer-account2
  // "/src/brodgers/customer-project-1" is the path to the project dir
  // "customer-account1" is the name of the account to use as the default for the specified dir
  // These defaults take precedence over the standard default account specified in the config
  getResolvedDefaultAccountForCWD(
    nameOrId: string | number
  ): CLIAccount_NEW | null {
    return this.getAccount(nameOrId);
  }

  getConfigAccountIndex(accountId: number): number {
    return this.config
      ? this.config.accounts.findIndex(
          account => account.accountId === accountId
        )
      : -1;
  }

  getConfigForAccount(accountId?: number): CLIAccount_NEW | null {
    if (this.config) {
      this.config.accounts.find(account => account.accountId === accountId) ||
        null;
    }
    return null;
  }

  isAccountInConfig(nameOrId: string | number): boolean {
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
    accountType?: AccountType,
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
  updateAccount(
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
      defaultMode,
      env,
      name,
      parentAccountId,
      personalAccessKey,
      sandboxAccountType,
      scopes,
      tokenInfo,
    } = updatedAccountFields;

    if (!accountId) {
      throwErrorWithMessage(
        `${i18nKey}.updateAccount.errors.accountIdRequired`
      );
    }
    if (!this.config) {
      logger.debug(i18n(`${i18nKey}.updateAccount.noConfigToUpdate`));
      return null;
    }

    const currentAccountConfig = this.getAccount(accountId);

    let auth: OAuthAccount_NEW['auth'] =
      (currentAccountConfig && currentAccountConfig.auth) || {};
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
    const updatedDefaultMode: ValueOf<typeof MODE> | undefined =
      defaultMode && (defaultMode.toLowerCase() as ValueOf<typeof MODE>);

    safelyApplyUpdates('name', name);
    safelyApplyUpdates('env', updatedEnv);
    safelyApplyUpdates('accountId', accountId);
    safelyApplyUpdates('authType', authType);
    safelyApplyUpdates('auth', auth);
    if (nextAccountConfig.authType === API_KEY_AUTH_METHOD.value) {
      safelyApplyUpdates('apiKey', apiKey);
    }
    if (typeof updatedDefaultMode !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      safelyApplyUpdates('defaultMode', MODE[updatedDefaultMode]);
    }
    safelyApplyUpdates('personalAccessKey', personalAccessKey);

    // Deprecating sandboxAccountType in favor of the more generic accountType
    safelyApplyUpdates('sandboxAccountType', sandboxAccountType);
    safelyApplyUpdates(
      'accountType',
      this.getAccountType(accountType, sandboxAccountType)
    );

    safelyApplyUpdates('parentAccountId', parentAccountId);

    const completedAccountConfig = nextAccountConfig as FlatAccountFields_NEW;

    if (currentAccountConfig) {
      logger.debug(
        i18n(`${i18nKey}.updateAccount.updating`, {
          accountId,
        })
      );
      const index = this.getConfigAccountIndex(accountId);
      this.config.accounts[index] = completedAccountConfig;
      logger.debug(
        i18n(`${i18nKey}.updateAccount.addingConfigEntry`, {
          accountId,
        })
      );
      if (this.config.accounts) {
        this.config.accounts.push(completedAccountConfig);
      } else {
        this.config.accounts = [completedAccountConfig];
      }
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
      throwErrorWithMessage(`${i18nKey}.errors.noConfigLoaded`);
    }
    if (
      !defaultAccount ||
      (typeof defaultAccount !== 'number' && typeof defaultAccount !== 'string')
    ) {
      throwErrorWithMessage(
        `${i18nKey}.updateDefaultAccount.errors.invalidInput`
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
      throwErrorWithMessage(`${i18nKey}.errors.noConfigLoaded`);
    }
    const accountId = this.getAccountId(currentName);
    let accountConfigToRename: CLIAccount_NEW | null = null;

    if (accountId) {
      accountConfigToRename = this.getAccount(accountId);
    }

    if (!accountConfigToRename) {
      throwErrorWithMessage(`${i18nKey}.renameAccount.errors.invalidName`, {
        currentName,
      });
    }

    if (accountId) {
      this.updateAccount({ accountId, name: newName, env: this.getEnv() });
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
      throwErrorWithMessage(`${i18nKey}.errors.noConfigLoaded`);
    }
    const accountId = this.getAccountId(nameOrId);

    if (!accountId) {
      throwErrorWithMessage(
        `${i18nKey}.removeAccountFromConfig.errors.invalidId`,
        { nameOrId }
      );
    }

    let removedAccountIsDefault = false;
    const accountConfig = this.getAccount(accountId);

    if (accountConfig) {
      logger.debug(
        i18n(`${i18nKey}.removeAccountFromConfig.deleting`, { accountId })
      );
      const index = this.getConfigAccountIndex(accountId);
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
  updateDefaultMode(defaultMode: string): CLIConfig_NEW | null {
    if (!this.config) {
      throwErrorWithMessage(`${i18nKey}.errors.noConfigLoaded`);
    }
    const ALL_MODES = Object.values(MODE);
    if (!defaultMode || !ALL_MODES.find(m => m === defaultMode)) {
      throwErrorWithMessage(`${i18nKey}.updateDefaultMode.errors.invalidMode`, {
        defaultMode,
        validModes: commaSeparatedValues(ALL_MODES),
      });
    }

    this.config.defaultMode = defaultMode;
    return this.write();
  }

  /**
   * @throws {Error}
   */
  updateHttpTimeout(timeout: string): CLIConfig_NEW | null {
    if (!this.config) {
      throwErrorWithMessage(`${i18nKey}.errors.noConfigLoaded`);
    }
    const parsedTimeout = parseInt(timeout);
    if (isNaN(parsedTimeout) || parsedTimeout < MIN_HTTP_TIMEOUT) {
      throwErrorWithMessage(
        `${i18nKey}.updateHttpTimeout.errors.invalidTimeout`,
        {
          timeout,
          minTimeout: MIN_HTTP_TIMEOUT,
        }
      );
    }

    this.config.httpTimeout = parsedTimeout;
    return this.write();
  }

  /**
   * @throws {Error}
   */
  updateAllowUsageTracking(isEnabled: boolean): CLIConfig_NEW | null {
    if (!this.config) {
      throwErrorWithMessage(`${i18nKey}.errors.noConfigLoaded`);
    }
    if (typeof isEnabled !== 'boolean') {
      throwErrorWithMessage(
        `${i18nKey}.updateAllowUsageTracking.errors.invalidInput`,
        {
          isEnabled: `${isEnabled}`,
        }
      );
    }

    this.config.allowUsageTracking = isEnabled;
    return this.write();
  }

  isTrackingAllowed(): boolean {
    if (!this.config) {
      return true;
    }
    return this.config.allowUsageTracking !== false;
  }
}

export default new CLIConfiguration();
