import { debug } from '../utils/logger';
import {
  API_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
} from '../constants/auth';
import { CLIConfig } from '../types/Config';
import { AuthType } from '../types/Accounts';

type PersonalAccessKeyOptions = {
  accountId: number;
  personalAccessKey: string;
  env: string;
};

function generatePersonalAccessKeyConfig({
  accountId,
  personalAccessKey,
  env,
}: PersonalAccessKeyOptions): Pick<CLIConfig, 'accounts'> {
  return {
    accounts: [
      {
        authType: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
        accountId,
        personalAccessKey,
        env,
      },
    ],
  };
}

type OAuthOptions = {
  accountId: number;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  scopes: Array<string>;
  env: string;
};

function generateOauthConfig({
  accountId,
  clientId,
  clientSecret,
  refreshToken,
  scopes,
  env,
}: OAuthOptions): Pick<CLIConfig, 'accounts'> {
  return {
    accounts: [
      {
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
      },
    ],
  };
}

type APIKeyOptions = {
  accountId: number;
  apiKey: string;
  env: string;
};

function generateApiKeyConfig({
  accountId,
  apiKey,
  env,
}: APIKeyOptions): Pick<CLIConfig, 'accounts'> {
  return {
    accounts: [
      {
        authType: API_KEY_AUTH_METHOD.value,
        accountId,
        apiKey,
        env,
      },
    ],
  };
}

export default function generateNewConfig(
  type: AuthType,
  options: PersonalAccessKeyOptions | OAuthOptions | APIKeyOptions
): Pick<CLIConfig, 'accounts'> | null {
  if (!options) {
    return null;
  }
  switch (type) {
    case API_KEY_AUTH_METHOD.value:
      return generateApiKeyConfig(options as APIKeyOptions);
    case PERSONAL_ACCESS_KEY_AUTH_METHOD.value:
      return generatePersonalAccessKeyConfig(
        options as PersonalAccessKeyOptions
      );
    case OAUTH_AUTH_METHOD.value:
      return generateOauthConfig(options as OAuthOptions);
    default:
      debug('config.generateNewConfig.unknownType', { type });
      return null;
  }
}
