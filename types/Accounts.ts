import { HUBSPOT_ACCOUNT_TYPES } from '../constants/config';
import { CmsPublishMode } from './Files';
import { Environment } from './Config';
import { ValueOf } from './Utils';
import {
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  API_KEY_AUTH_METHOD,
} from '../constants/auth';
export type AuthType = 'personalaccesskey' | 'apikey' | 'oauth2';

interface BaseHubSpotConfigAccount {
  name: string;
  accountId: number;
  accountType?: AccountType; // @TODO: make required?
  defaultCmsPublishMode?: CmsPublishMode;
  env: Environment;
  authType: AuthType;
  sandboxAccountType?: string;
  parentAccountId?: number;
}

export type DeprecatedHubSpotConfigAccountFields = {
  portalId?: number;
};

export type AccountType = ValueOf<typeof HUBSPOT_ACCOUNT_TYPES>;

export type TokenInfo = {
  accessToken?: string;
  expiresAt?: string;
  refreshToken?: string;
};

export interface PersonalAccessKeyConfigAccount
  extends BaseHubSpotConfigAccount {
  authType: typeof PERSONAL_ACCESS_KEY_AUTH_METHOD.value;
  personalAccessKey: string;
  auth: {
    tokenInfo: TokenInfo;
  };
}

export interface OAuthConfigAccount extends BaseHubSpotConfigAccount {
  authType: typeof OAUTH_AUTH_METHOD.value;
  auth: {
    clientId: string;
    clientSecret: string;
    scopes: Array<string>;
    tokenInfo: TokenInfo;
  };
}

export interface APIKeyConfigAccount extends BaseHubSpotConfigAccount {
  authType: typeof API_KEY_AUTH_METHOD.value;
  apiKey: string;
}

export type HubSpotConfigAccount =
  | PersonalAccessKeyConfigAccount
  | OAuthConfigAccount
  | APIKeyConfigAccount;

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
