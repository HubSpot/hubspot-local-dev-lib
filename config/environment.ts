import { CLIConfig_NEW, Environment } from '../types/Config';
import { logger } from '../lib/logger';
import { ENVIRONMENT_VARIABLES } from '../constants/environments';
import {
  API_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  OAUTH_SCOPES,
} from '../constants/auth';
import { generateConfig } from './configUtils';
import { getValidEnv } from '../lib/environment';
import { i18n } from '../utils/lang';

const i18nKey = 'config.environment';

type EnvironmentConfigVariables = {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  personalAccessKey?: string;
  accountId?: number;
  refreshToken?: string;
  env?: Environment;
};

function getConfigVariablesFromEnv(): EnvironmentConfigVariables {
  const env = process.env;

  return {
    apiKey: env[ENVIRONMENT_VARIABLES.HUBSPOT_API_KEY],
    clientId: env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_ID],
    clientSecret: env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_SECRET],
    personalAccessKey: env[ENVIRONMENT_VARIABLES.HUBSPOT_PERSONAL_ACCESS_KEY],
    accountId: parseInt(env[ENVIRONMENT_VARIABLES.HUBSPOT_ACCOUNT_ID]!, 10),
    refreshToken: env[ENVIRONMENT_VARIABLES.HUBSPOT_REFRESH_TOKEN],
    env: getValidEnv(
      env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT] as Environment
    ),
  };
}

export function loadConfigFromEnvironment(): CLIConfig_NEW | null {
  const {
    apiKey,
    clientId,
    clientSecret,
    personalAccessKey,
    accountId,
    refreshToken,
    env,
  } = getConfigVariablesFromEnv();
  if (!accountId) {
    logger.debug(i18n(`${i18nKey}.loadConfig.missingAccountId`));
    return null;
  }

  if (!env) {
    logger.debug(i18n(`${i18nKey}.loadConfig.missingEnv`));
    return null;
  }

  if (personalAccessKey) {
    return generateConfig(PERSONAL_ACCESS_KEY_AUTH_METHOD.value, {
      accountId,
      personalAccessKey,
      env,
    });
  } else if (clientId && clientSecret && refreshToken) {
    return generateConfig(OAUTH_AUTH_METHOD.value, {
      accountId,
      clientId,
      clientSecret,
      refreshToken,
      scopes: OAUTH_SCOPES.map((scope: { value: string }) => scope.value),
      env,
    });
  } else if (apiKey) {
    return generateConfig(API_KEY_AUTH_METHOD.value, {
      accountId,
      apiKey,
      env,
    });
  }

  logger.debug(i18n(`${i18nKey}.loadConfig.unknownAuthType`));
  return null;
}
