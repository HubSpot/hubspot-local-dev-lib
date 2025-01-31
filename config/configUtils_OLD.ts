import { logger } from '../lib/logger';
import {
  API_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
} from '../constants/auth';
import { CLIConfig_NEW } from '../types/Config';
import {
  AuthType,
  CLIAccount_NEW,
  APIKeyAccount_NEW,
  OAuthAccount_NEW,
  PersonalAccessKeyAccount_NEW,
  PersonalAccessKeyOptions,
  OAuthOptions,
  APIKeyOptions,
} from '../types/Accounts';
import { i18n } from '../utils/lang';

const i18nKey = 'config.configUtils';

export function getOrderedAccount(
  unorderedAccount: CLIAccount_NEW
): CLIAccount_NEW {
  const { name, accountId, env, authType, ...rest } = unorderedAccount;

  return {
    name,
    accountId,
    env,
    authType,
    ...rest,
  };
}

export function getOrderedConfig(
  unorderedConfig: CLIConfig_NEW
): CLIConfig_NEW {
  const {
    defaultAccount,
    defaultCmsPublishMode,
    httpTimeout,
    allowUsageTracking,
    accounts,
    ...rest
  } = unorderedConfig;

  return {
    ...(defaultAccount && { defaultAccount }),
    defaultCmsPublishMode,
    httpTimeout,
    allowUsageTracking,
    ...rest,
    accounts: accounts.map(getOrderedAccount),
  };
}

function generatePersonalAccessKeyAccountConfig({
  accountId,
  personalAccessKey,
  env,
}: PersonalAccessKeyOptions): PersonalAccessKeyAccount_NEW {
  return {
    authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
    accountId,
    personalAccessKey,
    env,
  };
}

function generateOauthAccountConfig({
  accountId,
  clientId,
  clientSecret,
  refreshToken,
  scopes,
  env,
}: OAuthOptions): OAuthAccount_NEW {
  return {
    authType: OAUTH_AUTH_METHOD.value,
    accountId,
    auth: {
      clientId,
      clientSecret,
      scopes,
      tokenInfo: {
        refreshToken,
      },
    },
    env,
  };
}

function generateApiKeyAccountConfig({
  accountId,
  apiKey,
  env,
}: APIKeyOptions): APIKeyAccount_NEW {
  return {
    authType: API_KEY_AUTH_METHOD.value,
    accountId,
    apiKey,
    env,
  };
}

export function generateConfig(
  type: AuthType,
  options: PersonalAccessKeyOptions | OAuthOptions | APIKeyOptions
): CLIConfig_NEW | null {
  if (!options) {
    return null;
  }
  const config: CLIConfig_NEW = { accounts: [] };
  let configAccount: CLIAccount_NEW;

  switch (type) {
    case API_KEY_AUTH_METHOD.value:
      configAccount = generateApiKeyAccountConfig(options as APIKeyOptions);
      break;
    case PERSONAL_ACCESS_KEY_AUTH_METHOD.value:
      configAccount = generatePersonalAccessKeyAccountConfig(
        options as PersonalAccessKeyOptions
      );
      break;
    case OAUTH_AUTH_METHOD.value:
      configAccount = generateOauthAccountConfig(options as OAuthOptions);
      break;
    default:
      logger.debug(i18n(`${i18nKey}.unknownType`, { type }));
      return null;
  }

  if (configAccount) {
    config.accounts.push(configAccount);
  }

  return config;
}
