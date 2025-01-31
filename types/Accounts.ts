import { HUBSPOT_ACCOUNT_TYPES } from '../constants/config';
import { CmsPublishMode } from './Files';
import { Environment } from './Config';
import { ValueOf } from './Utils';

export type AuthType = 'personalaccesskey' | 'apikey' | 'oauth2';

export interface HubSpotConfigAccount {
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
    scopes?: Array<string>;
  };
  sandboxAccountType?: string | null;
  parentAccountId?: number | null;
  apiKey?: string;
  personalAccessKey?: string;
}

export type DeprecatedHubSpotConfigAccountFields = {
  portalId: number;
};

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

export interface PersonalAccessKeyConfigAccount extends HubSpotConfigAccount {
  authType: 'personalaccesskey';
  personalAccessKey: string;
}

export interface OAuthConfigAccount extends HubSpotConfigAccount {
  authType: 'oauth2';
  auth: {
    clientId?: string;
    clientSecret?: string;
    scopes?: Array<string>;
    tokenInfo?: TokenInfo;
  };
}

export interface APIKeyConfigAccount extends HubSpotConfigAccount {
  authType: 'apikey';
  apiKey: string;
}

export interface HubSpotConfigAccountOptions extends HubSpotConfigAccount {
  tokenInfo?: TokenInfo;
  clientId?: string;
  clientSecret?: string;
  scopes?: Array<string>;
  apiKey?: string;
  personalAccessKey?: string;
}

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

// export type UpdateAccountConfigOptions =
//   Partial<FlatAccountFields_DEPRECATED> & {
//     environment?: Environment;
//   };

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
