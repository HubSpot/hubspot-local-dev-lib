import { HUBSPOT_ACCOUNT_TYPES } from '../constants/config';
import { CmsPublishMode } from './Files';
import { Environment } from './Config';
import { ValueOf } from './Utils';

export type AuthType = 'personalaccesskey' | 'apikey' | 'oauth2';

export interface CLIAccount_NEW {
  name?: string;
  accountId: number;
  accountType?: AccountType;
  defaultCmsPublishMode?: CmsPublishMode;
  env: Environment;
  authType?: AuthType;
  auth?: {
    tokenInfo?: TokenInfo;
    clientId?: string;
    clientSecret?: string;
  };
  sandboxAccountType?: string | null;
  parentAccountId?: number | null;
  apiKey?: string;
  personalAccessKey?: string;
}

export interface CLIAccount_DEPRECATED {
  name?: string;
  portalId?: number;
  defaultCmsPublishMode?: CmsPublishMode;
  env: Environment;
  accountType?: AccountType;
  authType?: AuthType;
  auth?: {
    tokenInfo?: TokenInfo;
  };
  sandboxAccountType?: string | null;
  parentAccountId?: number | null;
  apiKey?: string;
  personalAccessKey?: string;
}

export type CLIAccount = CLIAccount_NEW | CLIAccount_DEPRECATED;

export type GenericAccount = {
  portalId?: number;
  accountId?: number;
};

export type AccountType = ValueOf<typeof HUBSPOT_ACCOUNT_TYPES>;

export type TokenInfo = {
  accessToken?: string;
  expiresAt?: string;
  refreshToken?: string;
};

export interface PersonalAccessKeyAccount_NEW extends CLIAccount_NEW {
  authType: 'personalaccesskey';
  personalAccessKey: string;
}

export interface PersonalAccessKeyAccount_DEPRECATED
  extends CLIAccount_DEPRECATED {
  authType: 'personalaccesskey';
  personalAccessKey: string;
}

export type PersonalAccessKeyAccount =
  | PersonalAccessKeyAccount_NEW
  | PersonalAccessKeyAccount_DEPRECATED;

export interface OAuthAccount_NEW extends CLIAccount_NEW {
  authType: 'oauth2';
  auth: {
    clientId?: string;
    clientSecret?: string;
    scopes?: Array<string>;
    tokenInfo?: TokenInfo;
  };
}

export interface OAuthAccount_DEPRECATED extends CLIAccount_DEPRECATED {
  authType: 'oauth2';
  auth: {
    clientId?: string;
    clientSecret?: string;
    scopes?: Array<string>;
    tokenInfo?: TokenInfo;
  };
}

export type OAuthAccount = OAuthAccount_NEW | OAuthAccount_DEPRECATED;

export interface APIKeyAccount_NEW extends CLIAccount_NEW {
  authType: 'apikey';
  apiKey: string;
}

export interface APIKeyAccount_DEPRECATED extends CLIAccount_DEPRECATED {
  authType: 'apikey';
  apiKey: string;
}

export type APIKeyAccount = APIKeyAccount_NEW | APIKeyAccount_DEPRECATED;

export interface FlatAccountFields_NEW extends CLIAccount_NEW {
  tokenInfo?: TokenInfo;
  clientId?: string;
  clientSecret?: string;
  scopes?: Array<string>;
  apiKey?: string;
  personalAccessKey?: string;
}

export interface FlatAccountFields_DEPRECATED extends CLIAccount_DEPRECATED {
  tokenInfo?: TokenInfo;
  clientId?: string;
  clientSecret?: string;
  scopes?: Array<string>;
  apiKey?: string;
  personalAccessKey?: string;
}

export type FlatAccountFields =
  | FlatAccountFields_NEW
  | FlatAccountFields_DEPRECATED;

export type ScopeData = {
  portalScopesInGroup: Array<string>;
  userScopesInGroup: Array<string>;
};

export type AccessTokenResponse = {
  hubId: number;
  userId: number;
  oauthAccessToken: string;
  expiresAtMillis: number;
  enabledFeatures?: { [key: string]: number };
  scopeGroups: Array<string>;
  encodedOAuthRefreshToken: string;
  hubName: string;
  accountType: ValueOf<typeof HUBSPOT_ACCOUNT_TYPES>;
};

export type EnabledFeaturesResponse = {
  enabledFeatures: { [key: string]: boolean };
};

export type UpdateAccountConfigOptions =
  Partial<FlatAccountFields_DEPRECATED> & {
    environment?: Environment;
  };

export type PersonalAccessKeyOptions = {
  accountId: number;
  personalAccessKey: string;
  env: Environment;
};

export type OAuthOptions = {
  accountId: number;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  scopes: Array<string>;
  env: Environment;
};

export type APIKeyOptions = {
  accountId: number;
  apiKey: string;
  env: Environment;
};

export type AccessToken = {
  portalId: number;
  accessToken: string;
  expiresAt: string;
  scopeGroups: Array<string>;
  enabledFeatures?: { [key: string]: number };
  encodedOAuthRefreshToken: string;
  hubName: string;
  accountType: ValueOf<typeof HUBSPOT_ACCOUNT_TYPES>;
};

export type OAuth2ManagerAccountConfig = {
  name?: string;
  accountId?: number;
  clientId?: string;
  clientSecret?: string;
  scopes?: Array<string>;
  env?: Environment;
  environment?: Environment;
  tokenInfo?: TokenInfo;
  authType?: 'oauth2';
};

export type WriteTokenInfoFunction = (tokenInfo: TokenInfo) => void;

export type RefreshTokenResponse = {
  refresh_token: string;
  access_token: string;
  expires_in: string;
};

export type ExchangeProof = {
  grant_type: string;
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
};
