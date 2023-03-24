// TODO use debug util
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { debug } from '../utils/logger';
import { getValidEnv, loadConfigFromEnvironment } from './environment';
import {
  loadConfigFromFile,
  writeConfigToFile,
  configFileExists,
  configFileIsBlank,
  deleteConfigFile,
} from './configFile';
import { commaSeparatedValues } from '../utils/text';
import { ENVIRONMENTS } from '../constants';
// TODO should constants all export from the same place?
import { Mode, MIN_HTTP_TIMEOUT } from '../constants/config';
import { CLIConfig } from '../types/Config';
import { CLIAccount, OAuthAccount, FlatAccountFields } from '../types/Accounts';
import { CLIOptions } from '../types/CLIOptions';

class CLIConfiguration {
  active: boolean;
  options: CLIOptions;
  useEnvConfig: boolean;
  config: CLIConfig | null;

  constructor(options: CLIOptions) {
    this.active = false;
    this.options = options || {};
    this.useEnvConfig = false;
    this.config = null;
  }

  setActive(isActive: boolean): void {
    this.active = isActive;
  }

  init(options: CLIOptions): void {
    this.options = options;
    this.load();
    this.active = true;
  }

  load(): CLIConfig | null {
    if (this.options.useEnv) {
      const configFromEnv = loadConfigFromEnvironment();
      //TODO this will always return true as long as process.env has accountId. Do we want that?
      if (configFromEnv) {
        logger.debug(
          `Loaded config from environment variables for ${configFromEnv.accountId}`
        );
        this.useEnvConfig = true;
        this.config = configFromEnv;
      }
    } else {
      const configFromFile = loadConfigFromFile(this.options);
      logger.debug('Loaded config from configuration file.');
      if (!configFromFile) {
        logger.debug(
          'The config file was empty. Initializing an empty config.'
        );
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

  write(updatedConfig?: CLIConfig): CLIConfig | null {
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
      logger.error('Valiation failed: No config was found.');
      return false;
    }
    if (!Array.isArray(this.config.accounts)) {
      logger.error('Valiation failed: config.accounts[] is not defined.');
      return false;
    }

    const accountIdsMap: { [key: number]: boolean } = {};
    const accountNamesMap: { [key: string]: boolean } = {};

    return this.config.accounts.every(accountConfig => {
      if (!accountConfig) {
        logger.error('Valiation failed: config.accounts[] has an empty entry');
        return false;
      }
      if (!accountConfig.accountId) {
        logger.error(
          'Valiation failed: config.accounts[] has an entry missing accountId'
        );
        return false;
      }
      if (accountIdsMap[accountConfig.accountId]) {
        logger.error(
          `Valiation failed: config.accounts[] has multiple entries with accountId=${accountConfig.accountId}`
        );
        return false;
      }
      if (accountConfig.name) {
        if (accountNamesMap[accountConfig.name]) {
          logger.error(
            `Valiation failed: config.accounts[] has multiple entries with name=${accountConfig.name}`
          );
          return false;
        }
        if (/\s+/.test(accountConfig.name)) {
          logger.error(
            `Valiation failed: config.name '${accountConfig.name}' cannot contain spaces`
          );
          return false;
        }
        accountNamesMap[accountConfig.name] = true;
      }

      accountIdsMap[accountConfig.accountId] = true;
      return true;
    });
  }

  /*
   * Config Lookup Utils
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getConfigFlagValue(flag: keyof CLIConfig, defaultValue: any) {
    if (typeof defaultValue === 'undefined') {
      defaultValue = false;
    }

    if (this.config && typeof this.config[flag] !== 'undefined') {
      return this.config[flag];
    }
    return defaultValue;
  }

  getAccount(nameOrId: string | number | undefined): CLIAccount | null {
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

  getAccountId(nameOrId: string | number): number | null {
    const account = this.getAccount(nameOrId);
    return account ? account.accountId : null;
  }

  getDefaultAccount(): string | null {
    return this.config && this.config.defaultAccount
      ? this.config.defaultAccount
      : null;
  }

  // TODO a util that returns the account to use, respecting the values set in
  // "defaultAccountOverrides"
  // Example "defaultAccountOverrides":
  //  - /src/brodgers/customer-project: customer-account1
  // "/src/brodgers/customer-project" is the path to the project dir
  // "customer-account1" is the name of the account to use as the default for the specified dir
  getResolvedAccountForCWD(nameOrId: string | number): number | null {
    // NOTE none of the actual logic is coded into this yet
    return this.getAccountId(nameOrId);
  }

  getConfigAccountIndex(accountId: number): number {
    return this.config
      ? this.config.accounts.findIndex(
          account => account.accountId === accountId
        )
      : -1;
  }

  isAccountInConfig(nameOrId: string | number): boolean {
    return (
      !!this.config && this.config.accounts && !!this.getAccountId(nameOrId)
    );
  }

  getEnv(nameOrId: string | number): string {
    const accountId = this.getAccountId(nameOrId);

    if (accountId) {
      const accountConfig = this.getAccount(accountId);
      if (accountConfig && accountConfig.env) {
        return accountConfig.env;
      }
    } else {
      const env = this.getConfigFlagValue('env', null);
      if (env) {
        return env;
      }
    }
    return ENVIRONMENTS.PROD;
  }

  /*
   * Config Update Utils
   */

  /**
   * @throws {Error}
   */
  updateConfigForAccount(
    updatedAccountFields: FlatAccountFields,
    writeUpdate = true
  ): CLIAccount | null {
    const {
      accountId,
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
      throw new Error('An accountId is required to update the config');
    }
    if (!this.config) {
      logger.debug('No config to update.');
      return null;
    }

    const currentAccountConfig = this.getAccount(accountId);

    let auth: OAuthAccount['auth'];
    if (clientId || clientSecret || scopes || tokenInfo) {
      auth = {
        ...(currentAccountConfig ? currentAccountConfig.auth : {}),
        clientId,
        clientSecret,
        scopes,
        tokenInfo,
      };
    }

    const nextAccountConfig = {
      ...(currentAccountConfig ? currentAccountConfig : {}),
    } as CLIAccount;

    // Allow everything except for 'undefined' values to override the existing values
    const safelyApplyUpdates = (
      fieldName: keyof FlatAccountFields,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newValue: any
    ) => {
      if (typeof newValue !== 'undefined') {
        nextAccountConfig[fieldName] = newValue;
      }
    };

    const updatedEnv = getValidEnv(
      env || (currentAccountConfig && currentAccountConfig.env),
      {
        maskedProductionValue: undefined,
      }
    );
    const updatedDefaultMode = defaultMode && defaultMode.toLowerCase();

    safelyApplyUpdates('name', name);
    safelyApplyUpdates('env', updatedEnv);
    safelyApplyUpdates('accountId', accountId);
    safelyApplyUpdates('authType', authType);
    safelyApplyUpdates('auth', auth);
    if (nextAccountConfig.authType === 'apikey') {
      safelyApplyUpdates('apiKey', apiKey);
    }
    if (typeof updatedDefaultMode !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      safelyApplyUpdates('defaultMode', (Mode as any)[updatedDefaultMode]);
    }
    safelyApplyUpdates('personalAccessKey', personalAccessKey);
    safelyApplyUpdates('sandboxAccountType', sandboxAccountType);
    safelyApplyUpdates('parentAccountId', parentAccountId);

    if (currentAccountConfig) {
      logger.debug(`Updating account config for ${accountId}`);
      const index = this.getConfigAccountIndex(accountId);
      this.config.accounts[index] = nextAccountConfig;
    } else {
      logger.debug(`Adding account config entry for ${accountId}`);
      if (this.config.accounts) {
        this.config.accounts.push(nextAccountConfig);
      } else {
        this.config.accounts = [nextAccountConfig];
      }
    }

    if (writeUpdate) {
      this.write();
    }

    return nextAccountConfig;
  }

  /**
   * @throws {Error}
   */
  updateDefaultAccount(defaultAccount: string | number): CLIConfig | null {
    if (!this.config) {
      throw new Error('No Config loaded.');
    }
    if (
      !defaultAccount ||
      (typeof defaultAccount !== 'number' && typeof defaultAccount !== 'string')
    ) {
      throw new Error(
        `A 'defaultAccount' with value of number or string is required to update the config.`
      );
    }

    // TODO do we want to support numbers for default accounts?
    this.config.defaultAccount = defaultAccount;
    return this.write();
  }

  /**
   * @throws {Error}
   */
  renameAccount(currentName: string, newName: string): void {
    if (!this.config) {
      throw new Error('No Config loaded.');
    }
    const accountId = this.getAccountId(currentName);
    let accountConfigToRename;

    if (accountId) {
      accountConfigToRename = this.getAccount(accountId);
    }

    if (!accountConfigToRename) {
      throw new Error(`Cannot find account with identifier ${currentName}`);
    }

    if (accountId) {
      this.updateConfigForAccount({
        accountId,
        name: newName,
      });
    }

    if (accountConfigToRename.name === this.getDefaultAccount()) {
      this.updateDefaultAccount(newName);
    }
  }

  /**
   * @throws {Error}
   */
  removeAccountFromConfig(nameOrId: string | number): boolean {
    if (!this.config) {
      throw new Error('No Config loaded.');
    }
    const accountId = this.getAccountId(nameOrId);

    if (!accountId) {
      throw new Error(`Unable to find account for ${nameOrId}.`);
    }

    let shouldShowDefaultAccountPrompt = false;
    const accountConfig = this.getAccount(accountId);

    if (accountConfig) {
      logger.debug(`Deleting config for ${accountId}`);
      const index = this.getConfigAccountIndex(accountId);
      this.config.accounts.splice(index, 1);

      if (this.getDefaultAccount() === accountConfig.name) {
        shouldShowDefaultAccountPrompt = true;
      }

      this.write();
    }

    return shouldShowDefaultAccountPrompt;
  }

  /**
   * @throws {Error}
   */
  updateDefaultMode(defaultMode: string): CLIConfig | null {
    if (!this.config) {
      throw new Error('No Config loaded.');
    }
    const ALL_MODES = Object.values(Mode);
    if (!defaultMode || !ALL_MODES.find(m => m === defaultMode)) {
      throw new Error(
        `The mode ${defaultMode} is invalid. Valid values are ${commaSeparatedValues(
          ALL_MODES
        )}.`
      );
    }

    this.config.defaultMode = defaultMode;
    return this.write();
  }

  /**
   * @throws {Error}
   */
  updateHttpTimeout(timeout: string): CLIConfig | null {
    if (!this.config) {
      throw new Error('No Config loaded.');
    }
    const parsedTimeout = parseInt(timeout);
    if (isNaN(parsedTimeout) || parsedTimeout < MIN_HTTP_TIMEOUT) {
      throw new Error(
        `The value ${timeout} is invalid. The value must be a number greater than ${MIN_HTTP_TIMEOUT}.`
      );
    }

    this.config.httpTimeout = parsedTimeout;
    return this.write();
  }

  /**
   * @throws {Error}
   */
  updateAllowUsageTracking(isEnabled: boolean): CLIConfig | null {
    if (!this.config) {
      throw new Error('No Config loaded.');
    }
    if (typeof isEnabled !== 'boolean') {
      throw new Error(
        `Unable to update allowUsageTracking. The value ${isEnabled} is invalid. The value must be a boolean.`
      );
    }

    this.config.allowUsageTracking = isEnabled;
    return this.write();
  }
}

module.exports = CLIConfiguration;
