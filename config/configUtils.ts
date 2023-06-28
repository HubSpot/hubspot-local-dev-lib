import { debug } from '../utils/logger';
import {
  API_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
} from '../constants/auth';
import { CLIConfig, Environment } from '../types/Config';
import {
  AuthType,
  CLIAccount,
  APIKeyAccount,
  OAuthAccount,
  PersonalAccessKeyAccount,
} from '../types/Accounts';

export function getOrderedAccount(unorderedAccount: CLIAccount): CLIAccount {
  const { name, accountId, env, authType, ...rest } = unorderedAccount;

  return {
    name,
    accountId,
    env,
    authType,
    ...rest,
  };
}

export function getOrderedConfig(unorderedConfig: CLIConfig): CLIConfig {
  const {
    defaultAccount,
    defaultMode,
    httpTimeout,
    allowUsageTracking,
    accounts,
    ...rest
  } = unorderedConfig;

  return {
    ...(defaultAccount && { defaultAccount }),
    defaultMode,
    httpTimeout,
    allowUsageTracking,
    ...rest,
    accounts: accounts.map(getOrderedAccount),
  };
}

type PersonalAccessKeyOptions = {
  accountId: number;
  personalAccessKey: string;
  env: Environment;
};

function generatePersonalAccessKeyAccountConfig({
  accountId,
  personalAccessKey,
  env,
}: PersonalAccessKeyOptions): PersonalAccessKeyAccount {
  return {
    authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
    accountId,
    personalAccessKey,
    env,
  };
}

type OAuthOptions = {
  accountId: number;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  scopes: Array<string>;
  env: Environment;
};

function generateOauthAccountConfig({
  accountId,
  clientId,
  clientSecret,
  refreshToken,
  scopes,
  env,
}: OAuthOptions): OAuthAccount {
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

type APIKeyOptions = {
  accountId: number;
  apiKey: string;
  env: Environment;
};

function generateApiKeyAccountConfig({
  accountId,
  apiKey,
  env,
}: APIKeyOptions): APIKeyAccount {
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
): CLIConfig | null {
  if (!options) {
    return null;
  }
  const config: CLIConfig = { accounts: [] };
  let configAccount: CLIAccount;

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
      debug('config.configUtils.unknownType', { type });
      return null;
  }

  if (configAccount) {
    config.accounts.push(configAccount);
  }

  return config;
}
