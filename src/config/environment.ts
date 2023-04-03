import { CLIConfig } from '../types/Config';
import { debug } from '../utils/logger';
import { ENVIRONMENTS, ENVIRONMENT_VARIABLES } from '../constants';
// TODO should the constants all export from the same index file?
import {
  API_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  OAUTH_SCOPES,
} from '../constants/auth';
import generateNewConfig from './generateNewConfig';

/**
 * Returns environment constant for QA and PROD or optional masked value for PROD
 * @param {string} env Environment string, can be any case
 * @param {(boolean|object)} shouldMaskProduction Returning alternate value for PROD
 *    Can be used to hide env value in the config. Boolean can be used to simply mask 'prod' with ''. The default
 *    is not to modify the returned value for production, and instead return 'prod'.
 * @param {any} shouldMaskProduction.maskedProductionValue Alternate value to return in place of PROD
 */
export function getValidEnv(
  env?: string | null,
  shouldMaskProduction?: { maskedProductionValue?: string }
): string {
  const maskValue =
    typeof shouldMaskProduction === 'object' &&
    'maskedProductionValue' in shouldMaskProduction
      ? shouldMaskProduction.maskedProductionValue
      : '';
  const prodValue = shouldMaskProduction ? maskValue : ENVIRONMENTS.PROD;

  const returnVal =
    typeof env &&
    typeof env === 'string' &&
    env.toLowerCase() === ENVIRONMENTS.QA
      ? ENVIRONMENTS.QA
      : prodValue;

  return returnVal as string;
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
    env: getValidEnv(env[ENVIRONMENT_VARIABLES.HUBSPOT_ENVIRONMENT]),
  };
}

export function loadConfigFromEnvironment(): Pick<
  CLIConfig,
  'accounts'
> | null {
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
    return generateNewConfig(PERSONAL_ACCESS_KEY_AUTH_METHOD.value, {
      accountId,
      personalAccessKey,
      env,
    });
  } else if (clientId && clientSecret && refreshToken) {
    return generateNewConfig(OAUTH_AUTH_METHOD.value, {
      accountId,
      clientId,
      clientSecret,
      refreshToken,
      scopes: OAUTH_SCOPES.map((scope: { value: string }) => scope.value),
      env,
    });
  } else if (apiKey) {
    return generateNewConfig(API_KEY_AUTH_METHOD.value, {
      accountId,
      apiKey,
      env,
    });
  }

  debug('environment.loadConfig.unknownAuthType');
  return null;
}
