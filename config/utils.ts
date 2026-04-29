import fs from 'fs-extra';
import yaml from 'js-yaml';

import {
  HUBSPOT_ACCOUNT_TYPES,
  DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
  ENVIRONMENT_VARIABLES,
  ACCOUNT_IDENTIFIERS,
  HUBSPOT_CONFIG_ERROR_TYPES,
  HUBSPOT_CONFIG_OPERATIONS,
  GLOBAL_CONFIG_PATH,
} from '../constants/config.js';
import {
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  API_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  OAUTH_SCOPES,
} from '../constants/auth.js';
import {
  HubSpotConfig,
  DeprecatedHubSpotConfigFields,
  HubSpotConfigErrorType,
  HubSpotConfigValidationResult,
} from '../types/Config.js';
import { FileSystemError } from '../models/FileSystemError.js';
import {
  HubSpotConfigAccount,
  OAuthConfigAccount,
  AccountType,
  TokenInfo,
  DeprecatedHubSpotConfigAccountFields,
} from '../types/Accounts.js';
import { getValidEnv } from '../lib/environment.js';
import { getCwd } from '../lib/path.js';
import { CMS_PUBLISH_MODE } from '../constants/files.js';
import { i18n } from '../utils/lang.js';
import { ValueOf } from '../types/Utils.js';
import { HubSpotConfigError } from '../models/HubSpotConfigError.js';

export function getLocalConfigDefaultFilePath(): string {
  return `${getCwd()}/${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME}`;
}

export function getConfigPathEnvironmentVariables(): {
  useEnvironmentConfig: boolean;
  configFilePathFromEnvironment: string | undefined;
} {
  const configFilePathFromEnvironment =
    process.env[ENVIRONMENT_VARIABLES.HUBSPOT_CONFIG_PATH];
  const useEnvironmentConfig =
    process.env[ENVIRONMENT_VARIABLES.USE_ENVIRONMENT_HUBSPOT_CONFIG] ===
    'true';

  if (configFilePathFromEnvironment && useEnvironmentConfig) {
    throw new HubSpotConfigError(
      i18n(
        'config.utils.getConfigPathEnvironmentVariables.invalidEnvironmentVariables'
      ),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_ENVIRONMENT_VARIABLES,
      HUBSPOT_CONFIG_OPERATIONS.READ
    );
  }

  return {
    configFilePathFromEnvironment,
    useEnvironmentConfig,
  };
}

export function doesConfigFileExistAtPath(path: string): boolean {
  try {
    return fs.existsSync(path);
  } catch (error) {
    const { message, type } = handleConfigFileSystemError(error, path);
    throw new HubSpotConfigError(
      message,
      type,
      HUBSPOT_CONFIG_OPERATIONS.READ,
      { cause: error }
    );
  }
}

export function readConfigFile(configPath: string): string {
  try {
    return fs.readFileSync(configPath).toString();
  } catch (err) {
    const { message, type } = handleConfigFileSystemError(err, configPath);
    throw new HubSpotConfigError(
      message,
      type,
      HUBSPOT_CONFIG_OPERATIONS.READ,
      { cause: err }
    );
  }
}

export function removeUndefinedFieldsFromConfigAccount<
  T extends HubSpotConfigAccount | Partial<HubSpotConfigAccount> =
    HubSpotConfigAccount,
>(account: T): T {
  Object.keys(account).forEach(k => {
    const key = k as keyof T;
    if (account[key] === undefined) {
      delete account[key];
    }
  });

  if ('auth' in account && account.auth) {
    if (account.authType === OAUTH_AUTH_METHOD.value) {
      Object.keys(account.auth).forEach(k => {
        const key = k as keyof OAuthConfigAccount['auth'];
        if (account.auth?.[key] === undefined) {
          delete account.auth?.[key];
        }
      });
    }

    if (
      'tokenInfo' in account.auth &&
      typeof account.auth.tokenInfo === 'object'
    ) {
      Object.keys(account.auth.tokenInfo).forEach(k => {
        const key = k as keyof TokenInfo;
        if (account.auth?.tokenInfo[key] === undefined) {
          delete account.auth?.tokenInfo[key];
        }
      });
    }
  }

  return account;
}

// Ensure written config files have fields in a consistent order
export function formatConfigForWrite(config: HubSpotConfig): HubSpotConfig {
  const {
    defaultAccount,
    defaultCmsPublishMode,
    httpTimeout,
    allowUsageTracking,
    accounts,
    ...rest
  } = config;

  const orderedConfig = {
    ...(defaultAccount && { defaultAccount }),
    defaultCmsPublishMode,
    httpTimeout,
    allowUsageTracking,
    ...rest,
    accounts: accounts.map(account => {
      const { name, accountId, env, authType, ...rest } = account;

      const orderedAccount = {
        name,
        accountId,
        env,
        authType,
        ...rest,
        // using ...rest messes with the typing
      } as HubSpotConfigAccount;

      return removeUndefinedFieldsFromConfigAccount(orderedAccount);
    }),
  };

  return orderedConfig;
}

export function writeConfigFile(
  config: HubSpotConfig,
  configPath: string
): void {
  const formattedConfig = formatConfigForWrite(config);

  const configToWrite =
    configPath == GLOBAL_CONFIG_PATH
      ? formattedConfig
      : convertToDeprecatedConfig(formattedConfig);

  const source = yaml.dump(configToWrite);

  try {
    fs.ensureFileSync(configPath);
    fs.writeFileSync(configPath, source);
  } catch (err) {
    throw new FileSystemError(
      { cause: err },
      {
        filepath: configPath,
        operation: 'write',
      }
    );
  }
}

function getAccountType(sandboxAccountType?: string): AccountType {
  if (sandboxAccountType) {
    if (sandboxAccountType.toUpperCase() === 'DEVELOPER') {
      return HUBSPOT_ACCOUNT_TYPES.DEVELOPMENT_SANDBOX;
    }
    if (sandboxAccountType.toUpperCase() === 'STANDARD') {
      return HUBSPOT_ACCOUNT_TYPES.STANDARD_SANDBOX;
    }
  }
  return HUBSPOT_ACCOUNT_TYPES.STANDARD;
}

export function normalizeParsedConfig(
  parsedConfig: HubSpotConfig & DeprecatedHubSpotConfigFields
): HubSpotConfig {
  if (!parsedConfig.portals && !parsedConfig.accounts) {
    parsedConfig.accounts = [];
  }

  if (parsedConfig.portals) {
    parsedConfig.accounts = parsedConfig.portals.map(account => {
      if (account.portalId) {
        account.accountId = account.portalId;
        delete account.portalId;
      }
      if (!account.accountType) {
        account.accountType = getAccountType(account.sandboxAccountType);
        delete account.sandboxAccountType;
      }
      return account;
    });
    delete parsedConfig.portals;
  }

  if (parsedConfig.defaultPortal) {
    const defaultAccount = getConfigAccountByInferredIdentifier(
      parsedConfig.accounts,
      parsedConfig.defaultPortal
    );

    if (defaultAccount) {
      parsedConfig.defaultAccount = defaultAccount.accountId;
    }
    delete parsedConfig.defaultPortal;
  }

  if (parsedConfig.defaultMode) {
    parsedConfig.defaultCmsPublishMode = parsedConfig.defaultMode;
    delete parsedConfig.defaultMode;
  }

  return parsedConfig;
}

export function convertToDeprecatedConfig(
  config: HubSpotConfig
): Partial<HubSpotConfig> & Partial<DeprecatedHubSpotConfigFields> {
  const deprecatedConfig: Partial<HubSpotConfig> &
    DeprecatedHubSpotConfigFields = structuredClone(config);

  if (config.defaultAccount) {
    const defaultAccount = getConfigAccountByIdentifier(
      config.accounts,
      ACCOUNT_IDENTIFIERS.ACCOUNT_ID,
      config.defaultAccount
    );
    if (defaultAccount) {
      deprecatedConfig.defaultPortal = defaultAccount.name;
      delete deprecatedConfig.defaultAccount;
    }
  }

  const portals: Array<
    HubSpotConfigAccount & DeprecatedHubSpotConfigAccountFields
  > = config.accounts.map(account => {
    if (account.accountId) {
      const deprecatedAccount: HubSpotConfigAccount &
        DeprecatedHubSpotConfigAccountFields = structuredClone(account);
      deprecatedAccount.portalId = account.accountId;
      // @ts-expect-error deleting accountId is intential since using deprecated config format
      delete deprecatedAccount.accountId;

      return deprecatedAccount;
    }
    return account;
  });

  deprecatedConfig.portals = portals;
  delete deprecatedConfig.accounts;

  return deprecatedConfig;
}

export function parseConfig(
  configSource: string,
  configPath: string
): HubSpotConfig {
  let parsedYaml: HubSpotConfig & DeprecatedHubSpotConfigFields;

  try {
    parsedYaml = yaml.load(configSource) as HubSpotConfig &
      DeprecatedHubSpotConfigFields;
  } catch (err) {
    throw new HubSpotConfigError(
      i18n('config.utils.parseConfig.error', { configPath: configPath }),
      HUBSPOT_CONFIG_ERROR_TYPES.YAML_PARSING,
      HUBSPOT_CONFIG_OPERATIONS.READ,
      { cause: err }
    );
  }

  return normalizeParsedConfig(parsedYaml);
}

export function buildConfigFromEnvironment(): HubSpotConfig {
  const apiKey = process.env[ENVIRONMENT_VARIABLES.HUBSPOT_API_KEY];
  const clientId = process.env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_ID];
  const clientSecret = process.env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_SECRET];
  const personalAccessKey =
    process.env[ENVIRONMENT_VARIABLES.HUBSPOT_PERSONAL_ACCESS_KEY];
  const accountIdVar =
    process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ACCOUNT_ID] ||
    process.env[ENVIRONMENT_VARIABLES.HUBSPOT_PORTAL_ID];
  const refreshToken = process.env[ENVIRONMENT_VARIABLES.HUBSPOT_REFRESH_TOKEN];
  const hubspotEnvironment =
    process.env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT];
  const httpTimeoutVar = process.env[ENVIRONMENT_VARIABLES.HTTP_TIMEOUT];
  const httpUseLocalhostVar =
    process.env[ENVIRONMENT_VARIABLES.HTTP_USE_LOCALHOST];
  const allowUsageTrackingVar =
    process.env[ENVIRONMENT_VARIABLES.ALLOW_USAGE_TRACKING];
  const defaultCmsPublishModeVar =
    process.env[ENVIRONMENT_VARIABLES.DEFAULT_CMS_PUBLISH_MODE];

  if (!accountIdVar) {
    throw new HubSpotConfigError(
      i18n('config.utils.buildConfigFromEnvironment.missingAccountId'),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_ENVIRONMENT_VARIABLES,
      HUBSPOT_CONFIG_OPERATIONS.READ
    );
  }

  const accountId = parseInt(accountIdVar);
  const httpTimeout = httpTimeoutVar ? parseInt(httpTimeoutVar) : undefined;
  const httpUseLocalhost = httpUseLocalhostVar
    ? httpUseLocalhostVar === 'true'
    : undefined;
  const allowUsageTracking = allowUsageTrackingVar
    ? allowUsageTrackingVar === 'true'
    : undefined;
  const defaultCmsPublishMode =
    defaultCmsPublishModeVar === CMS_PUBLISH_MODE.draft ||
    defaultCmsPublishModeVar === CMS_PUBLISH_MODE.publish
      ? defaultCmsPublishModeVar
      : undefined;

  const env = getValidEnv(hubspotEnvironment);

  let account: HubSpotConfigAccount;

  if (personalAccessKey) {
    account = {
      authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
      accountId,
      personalAccessKey,
      env,
      name: accountIdVar,
      auth: {
        tokenInfo: {},
      },
    };
  } else if (clientId && clientSecret && refreshToken) {
    account = {
      authType: OAUTH_AUTH_METHOD.value,
      accountId,
      auth: {
        clientId,
        clientSecret,
        scopes: OAUTH_SCOPES.map((scope: { value: string }) => scope.value),
        tokenInfo: {
          refreshToken,
        },
      },
      env,
      name: accountIdVar,
    };
  } else if (apiKey) {
    account = {
      authType: API_KEY_AUTH_METHOD.value,
      accountId,
      apiKey,
      env,
      name: accountIdVar,
    };
  } else {
    throw new HubSpotConfigError(
      i18n('config.utils.buildConfigFromEnvironment.invalidAuthType'),
      HUBSPOT_CONFIG_ERROR_TYPES.INVALID_ENVIRONMENT_VARIABLES,
      HUBSPOT_CONFIG_OPERATIONS.READ
    );
  }

  return {
    accounts: [account],
    defaultAccount: accountId,
    httpTimeout,
    httpUseLocalhost,
    allowUsageTracking,
    defaultCmsPublishMode,
  };
}

export function getAccountIdentifierAndType(
  accountIdentifier: string | number
): {
  identifier: string | number;
  identifierType: ValueOf<typeof ACCOUNT_IDENTIFIERS>;
} {
  const identifierAsNumber =
    typeof accountIdentifier === 'number'
      ? accountIdentifier
      : parseInt(accountIdentifier);
  const isId = !isNaN(identifierAsNumber);

  return {
    identifier: isId ? identifierAsNumber : accountIdentifier,
    identifierType: isId
      ? ACCOUNT_IDENTIFIERS.ACCOUNT_ID
      : ACCOUNT_IDENTIFIERS.NAME,
  };
}

export function getConfigAccountByIdentifier(
  accounts: Array<HubSpotConfigAccount>,
  identifierFieldName: ValueOf<typeof ACCOUNT_IDENTIFIERS>,
  identifier: string | number
): HubSpotConfigAccount | undefined {
  return accounts.find(account => account[identifierFieldName] === identifier);
}

export function getConfigAccountByInferredIdentifier(
  accounts: Array<HubSpotConfigAccount>,
  accountIdentifier: string | number
): HubSpotConfigAccount | undefined {
  const { identifier, identifierType } =
    getAccountIdentifierAndType(accountIdentifier);

  const account = getConfigAccountByIdentifier(
    accounts,
    identifierType,
    identifier
  );

  if (account) {
    return account;
  }

  // Fallback to handle accounts with numbers as names
  return getConfigAccountByIdentifier(
    accounts,
    ACCOUNT_IDENTIFIERS.NAME,
    String(accountIdentifier)
  );
}

export function getConfigAccountIndexById(
  accounts: Array<HubSpotConfigAccount>,
  id: number
): number {
  return accounts.findIndex(account => account.accountId === id);
}

export function validateConfigAccount(
  account: Partial<HubSpotConfigAccount>
): HubSpotConfigValidationResult {
  const validationErrors = [];
  if (!account || typeof account !== 'object') {
    validationErrors.push(
      i18n('config.utils.validateConfigAccount.missingAccount')
    );
    return { isValid: false, errors: validationErrors };
  }

  if (!account.accountId) {
    validationErrors.push(
      i18n('config.utils.validateConfigAccount.missingAccountId')
    );
    return { isValid: false, errors: validationErrors };
  }

  if (!account.authType) {
    validationErrors.push(
      i18n('config.utils.validateConfigAccount.missingAuthType', {
        accountId: account.accountId,
      })
    );
    return { isValid: false, errors: validationErrors };
  }

  if (account.authType === PERSONAL_ACCESS_KEY_AUTH_METHOD.value) {
    const isValidPersonalAccessKeyAccount =
      'personalAccessKey' in account && Boolean(account.personalAccessKey);

    if (!isValidPersonalAccessKeyAccount) {
      validationErrors.push(
        i18n('config.utils.validateConfigAccount.missingPersonalAccessKey', {
          accountId: account.accountId,
        })
      );
    }
  }

  if (account.authType === OAUTH_AUTH_METHOD.value) {
    const isValidOAuthAccount = 'auth' in account && Boolean(account.auth);

    if (!isValidOAuthAccount) {
      validationErrors.push(
        i18n('config.utils.validateConfigAccount.missingAuth', {
          accountId: account.accountId,
        })
      );
    }
  }

  if (account.authType === API_KEY_AUTH_METHOD.value) {
    const isValidAPIKeyAccount = 'apiKey' in account && Boolean(account.apiKey);

    if (!isValidAPIKeyAccount) {
      validationErrors.push(
        i18n('config.utils.validateConfigAccount.missingApiKey', {
          accountId: account.accountId,
        })
      );
    }
  }

  return { isValid: validationErrors.length === 0, errors: validationErrors };
}

export function handleConfigFileSystemError(
  error: unknown,
  path: string
): { message?: string; type: HubSpotConfigErrorType } {
  let message;
  let type: HubSpotConfigErrorType = HUBSPOT_CONFIG_ERROR_TYPES.UNKNOWN;

  if (error instanceof Error && 'code' in error) {
    if (error.code === 'ENOENT') {
      message = i18n(
        'config.utils.handleConfigFileSystemError.configNotFoundError',
        { path }
      );
      type = HUBSPOT_CONFIG_ERROR_TYPES.CONFIG_NOT_FOUND;
    } else if (error.code === 'EACCES') {
      message = i18n(
        'config.utils.handleConfigFileSystemError.insufficientPermissionsError',
        { path }
      );
      type = HUBSPOT_CONFIG_ERROR_TYPES.INSUFFICIENT_PERMISSIONS;
    }
  }

  return { message, type };
}
