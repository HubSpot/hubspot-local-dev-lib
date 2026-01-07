import { HUBSPOT_ACCOUNT_TYPES } from '../constants/config.js';
import { CmsPublishMode } from './Files.js';
import { Environment } from './Config.js';
import { ValueOf } from './Utils.js';
import {
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  API_KEY_AUTH_METHOD,
} from '../constants/auth.js';
export type AuthType = 'personalaccesskey' | 'apikey' | 'oauth2';

interface BaseHubSpotConfigAccount {
  name: string;
  accountId: number;
  accountType?: AccountType;
  defaultCmsPublishMode?: CmsPublishMode;
  env: Environment;
  authType: AuthType;
  parentAccountId?: number;
}

export type DeprecatedHubSpotConfigAccountFields = {
  portalId?: number;
  sandboxAccountType?: string;
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

export type ScopeAuthorizationResponse = {
  results: Array<ScopeGroupAuthorization>;
};

export type ScopeGroupAuthorization = {
  scopeGroup: ScopeGroup;
  portalAuthorized: boolean;
  userAuthorized: boolean;
};

export type ScopeGroup = {
  name: string;
  shortDescription: string;
  longDescription: string;
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
