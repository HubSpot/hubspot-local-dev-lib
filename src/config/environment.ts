import { CLIConfig } from '../types/Config';
import { debug } from '../utils/logger';
import { ENVIRONMENTS, ENVIRONMENT_VARIABLES } from '../constants';
import {
  API_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  OAUTH_SCOPES,
} from '../constants/auth';
import { generateConfig } from './configUtils';

export function getValidEnv(
  env?: string | null,
  useProdDefault = true
): string | undefined {
  if (typeof env === 'string' && env.toLowerCase() === ENVIRONMENTS.QA) {
    return ENVIRONMENTS.QA;
  }
  return useProdDefault ? ENVIRONMENTS.PROD : undefined;
}

function getConfigVariablesFromEnv() {
  const env = process.env;

  return {
    apiKey: env[ENVIRONMENT_VARIABLES.HUBSPOT_API_KEY],
    clientId: env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_ID],
    clientSecret: env[ENVIRONMENT_VARIABLES.HUBSPOT_CLIENT_SECRET],
    personalAccessKey: env[ENVIRONMENT_VARIABLES.HUBSPOT_PERSONAL_ACCESS_KEY],
    accountId: parseInt(
      env[ENVIRONMENT_VARIABLES.HUBSPOT_ACCOUNT_ID] as string,
      10
    ),
    refreshToken: env[ENVIRONMENT_VARIABLES.HUBSPOT_REFRESH_TOKEN],
    env: getValidEnv(env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT]) as string,
  };
}

export function loadConfigFromEnvironment(): CLIConfig | null {
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
    debug('environment.loadConfig.missingAccountId');
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

  debug('environment.loadConfig.unknownAuthType');
  return null;
}
