import fs from 'fs-extra';
import yaml from 'js-yaml';
import findup from 'findup-sync';
import { getCwd } from '../lib/path';
import {
  DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
  MIN_HTTP_TIMEOUT,
  HUBSPOT_ACCOUNT_TYPES,
} from '../constants/config';
import { ENVIRONMENTS, ENVIRONMENT_VARIABLES } from '../constants/environments';
import {
  API_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  OAUTH_SCOPES,
} from '../constants/auth';
import { MODE } from '../constants/files';
import { getValidEnv } from '../lib/environment';
import { logger } from '../lib/logging/logger';
import { isConfigPathInGitRepo } from '../utils/git';
import {
  logErrorInstance,
  logFileSystemErrorInstance,
} from '../errors/errors_DEPRECATED';
import { CLIConfig_DEPRECATED, Environment } from '../types/Config';
import {
  APIKeyAccount_DEPRECATED,
  AccountType,
  CLIAccount_DEPRECATED,
  FlatAccountFields_DEPRECATED,
  OAuthAccount_DEPRECATED,
} from '../types/Accounts';
import { BaseError } from '../types/Error';
import { Mode } from '../types/Files';
import { CLIOptions, WriteConfigOptions } from '../types/CLIOptions';

const ALL_MODES = Object.values(MODE);
let _config: CLIConfig_DEPRECATED | null;
let _configPath: string | null;
let environmentVariableConfigLoaded = false;

const commaSeparatedValues = (
  arr: Array<string>,
  conjunction = 'and',
  ifempty = ''
): string => {
  const l = arr.length;
  if (!l) return ifempty;
  if (l < 2) return arr[0];
  if (l < 3) return arr.join(` ${conjunction} `);
  arr = arr.slice();
  arr[l - 1] = `${conjunction} ${arr[l - 1]}`;
  return arr.join(', ');
};

export const getConfig = () => _config;

export function setConfig(
  updatedConfig?: CLIConfig_DEPRECATED
): CLIConfig_DEPRECATED | null {
  _config = updatedConfig || null;
  return _config;
}

export function getConfigAccounts(
  config?: CLIConfig_DEPRECATED
): Array<CLIAccount_DEPRECATED> | undefined {
  const __config = config || getConfig();
  if (!__config) return;
  return __config.portals;
}

export function getConfigDefaultAccount(
  config?: CLIConfig_DEPRECATED
): string | number | undefined {
  const __config = config || getConfig();
  if (!__config) return;
  return __config.defaultPortal;
}

export function getConfigAccountId(
  account: CLIAccount_DEPRECATED
): number | undefined {
  if (!account) return;
  return account.portalId;
}

export function setConfigPath(path: string | null) {
  return (_configPath = path);
}

export function getConfigPath(path?: string | null): string | null {
  return path || (configFileExists() && _configPath) || findConfig(getCwd());
}

export function validateConfig(): boolean {
  const config = getConfig();
  if (!config) {
    logger.error('No config was found');
    return false;
  }
  const accounts = getConfigAccounts();
  if (!Array.isArray(accounts)) {
    logger.error('config.portals[] is not defined');
    return false;
  }
  const accountIdsHash: { [id: number]: CLIAccount_DEPRECATED } = {};
  const accountNamesHash: { [name: string]: CLIAccount_DEPRECATED } = {};

  return accounts.every(cfg => {
    if (!cfg) {
      logger.error('config.portals[] has an empty entry');
      return false;
    }

    const accountId = getConfigAccountId(cfg);
    if (!accountId) {
      logger.error('config.portals[] has an entry missing portalId');
      return false;
    }
    if (accountIdsHash[accountId]) {
      logger.error(
        `config.portals[] has multiple entries with portalId=${accountId}`
      );
      return false;
    }

    if (cfg.name) {
      if (accountNamesHash[cfg.name]) {
        logger.error(
          `config.name has multiple entries with portalId=${accountId}`
        );
        return false;
      }
      if (/\s+/.test(cfg.name)) {
        logger.error(`config.name '${cfg.name}' cannot contain spaces`);
        return false;
      }
      accountNamesHash[cfg.name] = cfg;
    }

    if (!cfg.accountType) {
      updateAccountConfig({
        ...cfg,
        portalId: accountId,
        accountType: getAccountType(undefined, cfg.sandboxAccountType),
      });
      writeConfig();
    }

    accountIdsHash[accountId] = cfg;
    return true;
  });
}

export function accountNameExistsInConfig(name: string): boolean {
  const config = getConfig();
  const accounts = getConfigAccounts();

  if (!config || !Array.isArray(accounts)) {
    return false;
  }

  return accounts.some(cfg => cfg.name && cfg.name === name);
}

export function getOrderedAccount(
  unorderedAccount: CLIAccount_DEPRECATED
): CLIAccount_DEPRECATED {
  const { name, portalId, env, authType, ...rest } = unorderedAccount;

  return {
    name,
    ...(portalId && { portalId }),
    env,
    authType,
    ...rest,
  };
}

export function getOrderedConfig(unorderedConfig: CLIConfig_DEPRECATED) {
  const {
    defaultPortal,
    defaultMode,
    httpTimeout,
    allowUsageTracking,
    portals,
    ...rest
  } = unorderedConfig;

  return {
    ...(defaultPortal && { defaultPortal }),
    defaultMode,
    httpTimeout,
    allowUsageTracking,
    ...rest,
    portals: portals.map(getOrderedAccount),
  };
}

export function writeConfig(options: WriteConfigOptions = {}): void {
  if (environmentVariableConfigLoaded) {
    return;
  }
  let source;
  try {
    source =
      typeof options.source === 'string'
        ? options.source
        : yaml.dump(
            JSON.parse(JSON.stringify(getOrderedConfig(getConfig()!), null, 2))
          );
  } catch (err) {
    logErrorInstance(err as BaseError);
    return;
  }
  const configPath = options.path || _configPath;
  try {
    logger.debug(`Writing current config to ${configPath}`);
    fs.ensureFileSync(configPath || '');
    fs.writeFileSync(configPath || '', source);
    setConfig(parseConfig(source).parsed);
  } catch (err) {
    logFileSystemErrorInstance(err as BaseError, {
      filepath: configPath || '',
      write: true,
    });
  }
}

function readConfigFile(): { source?: string; error?: BaseError } {
  let source;
  let error;
  if (!_configPath) {
    return { source, error };
  }
  try {
    isConfigPathInGitRepo(_configPath);
    source = fs.readFileSync(_configPath);
  } catch (err) {
    error = err as BaseError;
    logger.error('Config file could not be read "%s"', _configPath);
    logFileSystemErrorInstance(error, { filepath: _configPath, read: true });
  }
  return { source: source && source.toString(), error };
}

function parseConfig(configSource?: string): {
  parsed?: CLIConfig_DEPRECATED;
  error?: BaseError;
} {
  let parsed: CLIConfig_DEPRECATED | undefined = undefined;
  let error: BaseError | undefined = undefined;
  if (!configSource) {
    return { parsed, error };
  }
  try {
    parsed = yaml.load(configSource) as CLIConfig_DEPRECATED;
  } catch (err) {
    error = err as BaseError;
    logger.error('Config file could not be parsed "%s"', _configPath);
    logErrorInstance(err as BaseError);
  }
  return { parsed, error };
}

function loadConfigFromFile(path?: string, options: CLIOptions = {}) {
  setConfigPath(getConfigPath(path));
  if (!_configPath) {
    if (!options.silenceErrors) {
      logger.error(
        `A ${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME} file could not be found. To create a new config file, use the "hs init" command.`
      );
    } else {
      logger.debug(
        `A ${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME} file could not be found`
      );
    }
    return;
  }

  logger.debug(`Reading config from ${_configPath}`);
  const { source, error: sourceError } = readConfigFile();
  if (sourceError) return;
  const { parsed, error: parseError } = parseConfig(source);
  if (parseError) return;
  setConfig(parsed);

  if (!getConfig()) {
    logger.debug('The config file was empty config');
    logger.debug('Initializing an empty config');
    setConfig({ portals: [] });
  }

  return getConfig();
}

export function loadConfig(
  path?: string,
  options: CLIOptions = {
    useEnv: false,
  }
): CLIConfig_DEPRECATED | null {
  if (options.useEnv && loadEnvironmentVariableConfig(options)) {
    logger.debug('Loaded environment variable config');
    environmentVariableConfigLoaded = true;
  } else {
    path && logger.debug(`Loading config from ${path}`);
    loadConfigFromFile(path, options);
    environmentVariableConfigLoaded = false;
  }

  return getConfig();
}

export function isTrackingAllowed(): boolean {
  if (!configFileExists() || configFileIsBlank()) {
    return true;
  }
  const { allowUsageTracking } = getAndLoadConfigIfNeeded();
  return allowUsageTracking !== false;
}

export function getAndLoadConfigIfNeeded(
  options = {}
): Partial<CLIConfig_DEPRECATED> {
  if (!getConfig()) {
    loadConfig('', {
      silenceErrors: true,
      ...options,
    });
  }
  return getConfig() || { allowUsageTracking: undefined };
}

export function findConfig(directory: string): string | null {
  return findup(
    [
      DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
      DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME.replace('.yml', '.yaml'),
    ],
    { cwd: directory }
  );
}

export function getEnv(nameOrId?: string | number): Environment {
  let env: Environment = ENVIRONMENTS.PROD;
  const config = getAndLoadConfigIfNeeded();
  const accountId = getAccountId(nameOrId);

  if (accountId) {
    const accountConfig = getAccountConfig(accountId);
    if (accountConfig && accountConfig.env) {
      env = accountConfig.env;
    }
  } else if (config && config.env) {
    env = config.env;
  }
  return env;
}

// Deprecating sandboxAccountType in favor of accountType
export function getAccountType(
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

export function getAccountConfig(
  accountId: number | undefined
): CLIAccount_DEPRECATED | undefined {
  return getConfigAccounts(
    getAndLoadConfigIfNeeded() as CLIConfig_DEPRECATED
  )?.find(account => account.portalId === accountId);
}

/*
 * Returns a portalId from the config if it exists, else returns null
 */
export function getAccountId(nameOrId?: string | number): number | undefined {
  const config = getAndLoadConfigIfNeeded() as CLIConfig_DEPRECATED;
  let name: string | undefined = undefined;
  let accountId: number | undefined = undefined;
  let account: CLIAccount_DEPRECATED | undefined = undefined;

  function setNameOrAccountFromSuppliedValue(
    suppliedValue: string | number
  ): void {
    if (typeof suppliedValue === 'number') {
      accountId = suppliedValue;
    } else if (/^\d+$/.test(suppliedValue)) {
      accountId = parseInt(suppliedValue, 10);
    } else {
      name = suppliedValue;
    }
  }

  if (!nameOrId) {
    const defaultAccount = getConfigDefaultAccount(config);

    if (defaultAccount) {
      setNameOrAccountFromSuppliedValue(defaultAccount);
    }
  } else {
    setNameOrAccountFromSuppliedValue(nameOrId);
  }

  const accounts = getConfigAccounts(config);
  if (name && accounts) {
    account = accounts.find(p => p.name === name);
  } else if (accountId && accounts) {
    account = accounts.find(p => accountId === p.portalId);
  }

  if (account) {
    return account.portalId;
  }

  return undefined;
}

/**
 * @throws {Error}
 */
export function removeSandboxAccountFromConfig(
  nameOrId: string | number
): boolean {
  const config = getAndLoadConfigIfNeeded();
  const accountId = getAccountId(nameOrId);
  let promptDefaultAccount = false;

  if (!accountId) {
    throw new Error(`Unable to find account for ${nameOrId}.`);
  }

  const accountConfig = getAccountConfig(accountId);

  const accountType = getAccountType(
    accountConfig?.accountType,
    accountConfig?.sandboxAccountType
  );

  const isSandboxAccount =
    accountType === HUBSPOT_ACCOUNT_TYPES.DEVELOPMENT_SANDBOX ||
    accountType === HUBSPOT_ACCOUNT_TYPES.STANDARD_SANDBOX;

  if (!isSandboxAccount) return promptDefaultAccount;

  if (config.defaultPortal === accountConfig?.name) {
    promptDefaultAccount = true;
  }

  const accounts = getConfigAccounts(config as CLIConfig_DEPRECATED);

  if (accountConfig && accounts) {
    logger.debug(`Deleting config for ${accountId}`);
    const index = accounts.indexOf(accountConfig);
    accounts.splice(index, 1);
  }

  writeConfig();

  return promptDefaultAccount;
}

type UpdateAccountConfigOptions = Partial<FlatAccountFields_DEPRECATED> & {
  environment?: Environment;
};

/**
 * @throws {Error}
 */
export function updateAccountConfig(
  configOptions: UpdateAccountConfigOptions
): FlatAccountFields_DEPRECATED {
  const {
    accountType,
    apiKey,
    authType,
    clientId,
    clientSecret,
    defaultMode,
    environment,
    name,
    parentAccountId,
    personalAccessKey,
    portalId,
    sandboxAccountType,
    scopes,
    tokenInfo,
  } = configOptions;

  if (!portalId) {
    throw new Error('A portalId is required to update the config');
  }

  const config = getAndLoadConfigIfNeeded() as CLIConfig_DEPRECATED;
  const accountConfig = getAccountConfig(portalId);

  let auth: OAuthAccount_DEPRECATED['auth'] | undefined =
    accountConfig && accountConfig.auth;
  if (clientId || clientSecret || scopes || tokenInfo) {
    auth = {
      ...(accountConfig ? accountConfig.auth : {}),
      clientId,
      clientSecret,
      scopes,
      tokenInfo,
    };
  }

  const env = getValidEnv(
    environment ||
      (configOptions && configOptions.env) ||
      (accountConfig && accountConfig.env)
  );
  const mode: Mode | undefined =
    defaultMode && (defaultMode.toLowerCase() as Mode);
  const nextAccountConfig: FlatAccountFields_DEPRECATED = {
    ...accountConfig,
    name: name || (accountConfig && accountConfig.name),
    env,
    ...(portalId && { portalId }),
    authType,
    auth,
    accountType: getAccountType(accountType, sandboxAccountType),
    apiKey,
    defaultMode: mode && Object.hasOwn(MODE, mode) ? mode : undefined,
    personalAccessKey,
    sandboxAccountType,
    parentAccountId,
  };

  let accounts = getConfigAccounts(config);
  if (accountConfig && accounts) {
    logger.debug(`Updating config for ${portalId}`);
    const index = accounts.indexOf(accountConfig);
    accounts[index] = nextAccountConfig;
  } else {
    logger.debug(`Adding config entry for ${portalId}`);
    if (accounts) {
      accounts.push(nextAccountConfig);
    } else {
      accounts = [nextAccountConfig];
    }
  }

  return nextAccountConfig;
}

/**
 * @throws {Error}
 */
export function updateDefaultAccount(defaultAccount: string | number): void {
  if (
    !defaultAccount ||
    (typeof defaultAccount !== 'number' && typeof defaultAccount !== 'string')
  ) {
    throw new Error(
      `A 'defaultPortal' with value of number or string is required to update the config`
    );
  }

  const config = getAndLoadConfigIfNeeded();
  config.defaultPortal = defaultAccount;

  setDefaultConfigPathIfUnset();
  writeConfig();
}

/**
 * @throws {Error}
 */
export function updateDefaultMode(defaultMode: Mode): void {
  if (!defaultMode || !ALL_MODES.find(m => m === defaultMode)) {
    throw new Error(
      `The mode ${defaultMode} is invalid. Valid values are ${commaSeparatedValues(
        ALL_MODES
      )}.`
    );
  }

  const config = getAndLoadConfigIfNeeded();
  config.defaultMode = defaultMode;

  setDefaultConfigPathIfUnset();
  writeConfig();
}

/**
 * @throws {Error}
 */
export function updateHttpTimeout(timeout: string): void {
  const parsedTimeout = parseInt(timeout);
  if (isNaN(parsedTimeout) || parsedTimeout < MIN_HTTP_TIMEOUT) {
    throw new Error(
      `The value ${timeout} is invalid. The value must be a number greater than ${MIN_HTTP_TIMEOUT}.`
    );
  }

  const config = getAndLoadConfigIfNeeded();
  config.httpTimeout = parsedTimeout;

  setDefaultConfigPathIfUnset();
  writeConfig();
}

/**
 * @throws {Error}
 */
export function updateAllowUsageTracking(isEnabled: boolean): void {
  if (typeof isEnabled !== 'boolean') {
    throw new Error(
      `Unable to update allowUsageTracking. The value ${isEnabled} is invalid. The value must be a boolean.`
    );
  }

  const config = getAndLoadConfigIfNeeded();
  config.allowUsageTracking = isEnabled;

  setDefaultConfigPathIfUnset();
  writeConfig();
}

/**
 * @throws {Error}
 */
export async function renameAccount(
  currentName: string,
  newName: string
): Promise<void> {
  const accountId = getAccountId(currentName);
  const accountConfigToRename = getAccountConfig(accountId);
  const defaultAccount = getConfigDefaultAccount();

  if (!accountConfigToRename) {
    throw new Error(`Cannot find account with identifier ${currentName}`);
  }

  await updateAccountConfig({
    ...accountConfigToRename,
    name: newName,
  });

  if (accountConfigToRename.name === defaultAccount) {
    updateDefaultAccount(newName);
  }

  return writeConfig();
}

/**
 * @throws {Error}
 */
export async function deleteAccount(accountName: string): Promise<void> {
  const config = getAndLoadConfigIfNeeded() as CLIConfig_DEPRECATED;
  const accounts = getConfigAccounts(config);
  const accountIdToDelete = getAccountId(accountName);

  if (!accountIdToDelete || !accounts) {
    throw new Error(`Cannot find account with identifier ${accountName}`);
  }

  setConfig({
    ...config,
    defaultPortal:
      config.defaultPortal === accountName ||
      config.defaultPortal === accountIdToDelete
        ? undefined
        : config.defaultPortal,
    portals: accounts.filter(account => account.portalId !== accountIdToDelete),
  });

  return writeConfig();
}

function setDefaultConfigPathIfUnset(): void {
  if (!_configPath) {
    setDefaultConfigPath();
  }
}

function setDefaultConfigPath(): void {
  setConfigPath(`${getCwd()}/${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME}`);
}

function configFileExists(): boolean {
  return Boolean(_configPath && fs.existsSync(_configPath));
}

function configFileIsBlank(): boolean {
  return Boolean(_configPath && fs.readFileSync(_configPath).length === 0);
}

export function createEmptyConfigFile({ path }: { path?: string } = {}): void {
  if (!path) {
    setDefaultConfigPathIfUnset();

    if (configFileExists()) {
      return;
    }
  } else {
    setConfigPath(path);
  }

  writeConfig({ source: '', path });
}

export function deleteEmptyConfigFile(): void {
  configFileExists() && configFileIsBlank() && fs.unlinkSync(_configPath || '');
}

export function deleteConfigFile(): void {
  configFileExists() && fs.unlinkSync(_configPath || '');
}

function getConfigVariablesFromEnv() {
  const env = process.env;

  return {
    apiKey: env[ENVIRONMENT_VARIABLES.HUBSPOT_API_KEY],
    clientId: env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_ID],
    clientSecret: env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_SECRET],
    personalAccessKey: env[ENVIRONMENT_VARIABLES.HUBSPOT_PERSONAL_ACCESS_KEY],
    portalId: parseInt(env[ENVIRONMENT_VARIABLES.HUBSPOT_PORTAL_ID] || '', 10),
    refreshToken: env[ENVIRONMENT_VARIABLES.HUBSPOT_REFRESH_TOKEN],
    httpTimeout: env[ENVIRONMENT_VARIABLES.HTTP_TIMEOUT]
      ? parseInt(env[ENVIRONMENT_VARIABLES.HTTP_TIMEOUT] as string)
      : undefined,
    env: getValidEnv(
      env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT] as Environment
    ),
  };
}

function generatePersonalAccessKeyConfig(
  portalId: number,
  personalAccessKey: string,
  env: Environment,
  httpTimeout?: number
): { portals: Array<CLIAccount_DEPRECATED>; httpTimeout?: number } {
  return {
    portals: [
      {
        authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
        portalId,
        personalAccessKey,
        env,
      },
    ],
    httpTimeout,
  };
}

function generateOauthConfig(
  portalId: number,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  scopes: Array<string>,
  env: Environment,
  httpTimeout?: number
): { portals: Array<OAuthAccount_DEPRECATED>; httpTimeout?: number } {
  return {
    portals: [
      {
        authType: OAUTH_AUTH_METHOD.value,
        portalId,
        auth: {
          clientId,
          clientSecret,
          scopes,
          tokenInfo: {
            refreshToken,
          },
        },
        env,
      },
    ],
    httpTimeout,
  };
}

function generateApiKeyConfig(
  portalId: number,
  apiKey: string,
  env: Environment
): { portals: Array<APIKeyAccount_DEPRECATED> } {
  return {
    portals: [
      {
        authType: API_KEY_AUTH_METHOD.value,
        portalId,
        apiKey,
        env,
      },
    ],
  };
}

export function loadConfigFromEnvironment({
  useEnv = false,
}: { useEnv?: boolean } = {}):
  | { portals: Array<CLIAccount_DEPRECATED> }
  | undefined {
  const {
    apiKey,
    clientId,
    clientSecret,
    personalAccessKey,
    portalId,
    refreshToken,
    env,
    httpTimeout,
  } = getConfigVariablesFromEnv();
  const unableToLoadEnvConfigError =
    'Unable to load config from environment variables.';

  if (!portalId) {
    useEnv && logger.error(unableToLoadEnvConfigError);
    return;
  }

  if (httpTimeout && httpTimeout < MIN_HTTP_TIMEOUT) {
    throw new Error(
      `The HTTP timeout value ${httpTimeout} is invalid. The value must be a number greater than ${MIN_HTTP_TIMEOUT}.`
    );
  }

  if (personalAccessKey) {
    return generatePersonalAccessKeyConfig(
      portalId,
      personalAccessKey,
      env,
      httpTimeout
    );
  } else if (clientId && clientSecret && refreshToken) {
    return generateOauthConfig(
      portalId,
      clientId,
      clientSecret,
      refreshToken,
      OAUTH_SCOPES.map(scope => scope.value),
      env,
      httpTimeout
    );
  } else if (apiKey) {
    return generateApiKeyConfig(portalId, apiKey, env);
  } else {
    useEnv && logger.error(unableToLoadEnvConfigError);
    return;
  }
}

function loadEnvironmentVariableConfig(options: {
  useEnv?: boolean;
}): CLIConfig_DEPRECATED | null {
  const envConfig = loadConfigFromEnvironment(options);

  if (!envConfig) {
    return null;
  }
  const { portalId } = getConfigVariablesFromEnv();

  logger.debug(
    `Loaded config from environment variables for account ${portalId}`
  );

  return setConfig(envConfig);
}

export function isConfigFlagEnabled(flag: keyof CLIConfig_DEPRECATED): boolean {
  if (!configFileExists() || configFileIsBlank()) {
    return false;
  }

  const config = getAndLoadConfigIfNeeded();

  return Boolean(config[flag] || false);
}
