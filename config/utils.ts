import fs from 'fs-extra';
import yaml from 'js-yaml';
import findup from 'findup-sync';

import {
  HUBSPOT_ACCOUNT_TYPES,
  DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
  ENVIRONMENT_VARIABLES,
  ACCOUNT_IDENTIFIERS,
  GLOBAL_CONFIG_PATH,
  HUBSPOT_CONFIG_ERROR_TYPES,
  HUBSPOT_CONFIG_OPERATIONS,
} from '../constants/config';
import {
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  API_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  OAUTH_SCOPES,
} from '../constants/auth';
import { HubSpotConfig, DeprecatedHubSpotConfigFields } from '../types/Config';
import { FileSystemError } from '../models/FileSystemError';
import { logger } from '../lib/logger';
import {
  HubSpotConfigAccount,
  OAuthConfigAccount,
  AccountType,
  TokenInfo,
} from '../types/Accounts';
import { getValidEnv } from '../lib/environment';
import { getCwd } from '../lib/path';
import { CMS_PUBLISH_MODE } from '../constants/files';
import { i18n } from '../utils/lang';
import { ValueOf } from '../types/Utils';
import { HubSpotConfigError } from '../models/HubSpotConfigError';

export function getGlobalConfigFilePath(): string {
  return GLOBAL_CONFIG_PATH;
}

export function getLocalConfigFilePath(): string | null {
  return findup(
    [
      DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
      DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME.replace('.yml', '.yaml'),
    ],
    { cwd: getCwd() }
  );
}

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

export function readConfigFile(configPath: string): string {
  let source = '';

  try {
    source = fs.readFileSync(configPath).toString();
  } catch (err) {
    throw new FileSystemError(
      { cause: err },
      {
        filepath: configPath,
        operation: 'read',
      }
    );
  }

  return source;
}

export function removeUndefinedFieldsFromConfigAccount<
  T extends
    | HubSpotConfigAccount
    | Partial<HubSpotConfigAccount> = HubSpotConfigAccount,
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
export function formatConfigForWrite(config: HubSpotConfig) {
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

      return {
        name,
        accountId,
        env,
        authType,
        ...rest,
      };
    }),
  };

  return removeUndefinedFieldsFromConfigAccount(orderedConfig);
}

export function writeConfigFile(
  config: HubSpotConfig,
  configPath: string
): void {
  const source = yaml.dump(
    JSON.parse(JSON.stringify(formatConfigForWrite(config), null, 2))
  );

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
  return accounts.find(account => account[identifierType] === identifier);
}

export function getConfigAccountIndexById(
  accounts: Array<HubSpotConfigAccount>,
  id: number
): number {
  return accounts.findIndex(account => account.accountId === id);
}

export function isConfigAccountValid(
  account: Partial<HubSpotConfigAccount>
): boolean {
  if (!account || typeof account !== 'object') {
    logger.debug(i18n('config.utils.isConfigAccountValid.missingAccount'));
    return false;
  }

  if (!account.accountId) {
    logger.debug(i18n('config.utils.isConfigAccountValid.missingAccountId'));
    return false;
  }

  if (!account.authType) {
    logger.debug(
      i18n('config.utils.isConfigAccountValid.missingAuthType', {
        accountId: account.accountId,
      })
    );
    return false;
  }

  let valid = false;

  if (account.authType === PERSONAL_ACCESS_KEY_AUTH_METHOD.value) {
    valid =
      'personalAccessKey' in account && Boolean(account.personalAccessKey);

    if (!valid) {
      logger.debug(
        i18n('config.utils.isConfigAccountValid.missingPersonalAccessKey', {
          accountId: account.accountId,
        })
      );
    }
  }

  if (account.authType === OAUTH_AUTH_METHOD.value) {
    valid = 'auth' in account && Boolean(account.auth);

    if (!valid) {
      logger.debug(
        i18n('config.utils.isConfigAccountValid.missingAuth', {
          accountId: account.accountId,
        })
      );
    }
  }

  if (account.authType === API_KEY_AUTH_METHOD.value) {
    valid = 'apiKey' in account && Boolean(account.apiKey);

    if (!valid) {
      logger.debug(
        i18n('config.utils.isConfigAccountValid.missingApiKey', {
          accountId: account.accountId,
        })
      );
    }
  }

  return valid;
}
