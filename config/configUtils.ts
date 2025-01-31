import path from 'path';
import os from 'os';
import fs from 'fs';
import yaml from 'js-yaml';

import {
  HUBSPOT_CONFIGURATION_FOLDER,
  HUBSPOT_CONFIGURATION_FILE,
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
import { HubSpotConfigAccount } from '../types/Accounts';
import { getValidEnv } from '../lib/environment';

export function getGlobalConfigFilePath(): string {
  return path.join(
    os.homedir(),
    HUBSPOT_CONFIGURATION_FOLDER,
    HUBSPOT_CONFIGURATION_FILE
  );
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

export function loadConfigFromEnvironment(): HubSpotConfig {
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
    };
  } else if (apiKey) {
    account = {
      authType: API_KEY_AUTH_METHOD.value,
      accountId,
      apiKey,
      env,
    };
  } else {
    throw new Error('@TODO');
  }

  return { accounts: [account] };
}
