import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import yaml from 'js-yaml';

import {
  HUBSPOT_CONFIGURATION_FOLDER,
  HUBSPOT_CONFIGURATION_FILE,
  HUBSPOT_ACCOUNT_TYPES,
  DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
} from '../constants/config';
import { ENVIRONMENT_VARIABLES } from '../constants/environments';
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
  AccountType,
  OAuthConfigAccount,
} from '../types/Accounts';
import { getValidEnv } from '../lib/environment';
import { getCwd } from '../lib/path';

export function getGlobalConfigFilePath(): string {
  return path.join(
    os.homedir(),
    HUBSPOT_CONFIGURATION_FOLDER,
    HUBSPOT_CONFIGURATION_FILE
  );
}

export function getLocalConfigFileDefaultPath(): string {
  return `${getCwd()}/${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME}`;
}

export function readConfigFile(configPath: string): string {
  let source = '';

  try {
    source = fs.readFileSync(configPath).toString();
  } catch (err) {
    logger.debug('@TODO Error reading');
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

  if (hasAuthField(account)) {
    Object.keys(account.auth).forEach(k => {
      const key = k as keyof T;
      if (account[key] === undefined) {
        delete account[key];
      }
    });
  }

  return account;
}

// Ensure written config files have fields in a consistent order
function formatConfigForWrite(config: HubSpotConfig) {
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
    logger.debug('@TODO');
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
      account.accountId = account.portalId;
      return account;
    });
  }

  if (parsedConfig.defaultPortal) {
    parsedConfig.defaultAccount = parsedConfig.defaultPortal;
  }

  if (parsedConfig.defaultMode) {
    parsedConfig.defaultCmsPublishMode = parsedConfig.defaultMode;
  }

  parsedConfig.accounts.forEach(account => {
    if (!account.accountType) {
      account.accountType = getAccountType(account.sandboxAccountType);
    }
  });

  return parsedConfig;
}

export function parseConfig(configSource: string): HubSpotConfig {
  let parsedYaml: HubSpotConfig & DeprecatedHubSpotConfigFields;

  try {
    parsedYaml = yaml.load(configSource) as HubSpotConfig &
      DeprecatedHubSpotConfigFields;
  } catch (err) {
    throw new Error('@TODO Error parsing', { cause: err });
  }

  return normalizeParsedConfig(parsedYaml);
}

export function buildConfigFromEnvironment(): HubSpotConfig {
  // @TODO: Add other config fields
  // @TODO: handle account type?
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

  if (!accountIdVar) {
    throw new Error('@TODO');
  }

  const accountId = parseInt(accountIdVar);

  const env = getValidEnv(hubspotEnvironment);

  let account: HubSpotConfigAccount;

  if (personalAccessKey) {
    account = {
      authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
      accountId,
      personalAccessKey,
      env,
      name: accountIdVar,
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
    throw new Error('@TODO');
  }

  return { accounts: [account], defaultAccount: accountIdVar };
}

export function getConfigAccountByIdentifier(
  accounts: Array<HubSpotConfigAccount>,
  identifierFieldName: 'name' | 'accountId',
  identifier: string | number
): HubSpotConfigAccount | undefined {
  return accounts.find(account => account[identifierFieldName] === identifier);
}

export function getConfigAccountIndexById(
  accounts: Array<HubSpotConfigAccount>,
  id: string | number
): number {
  return accounts.findIndex(account => account.accountId === id);
}

export function hasAuthField(
  account: Partial<HubSpotConfigAccount>
): account is OAuthConfigAccount {
  return 'auth' in account && typeof account.auth === 'object';
}

export function isConfigAccountValid(account: HubSpotConfigAccount) {
  if (!account || typeof account !== 'object') {
    return false;
  }

  if (!account.authType) {
    return false;
  }

  if (account.authType === PERSONAL_ACCESS_KEY_AUTH_METHOD.value) {
    return 'personalAccessKey' in account && account.personalAccessKey;
  }

  if (account.authType === OAUTH_AUTH_METHOD.value) {
    return 'auth' in account && account.auth;
  }

  if (account.authType === API_KEY_AUTH_METHOD.value) {
    return 'apiKey' in account && account.apiKey;
  }

  return false;
}
