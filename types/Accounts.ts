import { DEFAULT_MODES } from '../constants/config';
import { ValueOf } from './Utils';

export type AuthType = 'personalaccesskey' | 'apikey' | 'oauth2';

export interface CLIAccount {
  name?: string;
  accountId: number;
  defaultMode?: ValueOf<typeof DEFAULT_MODES>;
  env?: string;
  authType?: AuthType;
  auth?: object;
  sandboxAccountType?: string | null;
  parentAccountId?: number | null;
  apiKey?: string;
  personalAccessKey?: string;
}

export type PersonalAccessKeyTokenInfo = {
  accessToken: string;
  expiresAt: string;
};

export type OauthTokenInfo = {
  refreshToken?: string;
};

export interface PersonalAccessKeyAccount extends CLIAccount {
  authType: 'personalaccesskey';
  auth?: {
    tokenInfo: PersonalAccessKeyTokenInfo;
  };
  personalAccessKey: string;
}

export interface OAuthAccount extends CLIAccount {
  authType: 'oauth2';
  auth?: {
    clientId?: string;
    clientSecret?: string;
    scopes?: Array<string>;
    tokenInfo?: OauthTokenInfo;
  };
}

export interface APIKeyAccount extends CLIAccount {
  authType: 'apikey';
  apiKey: string;
}

export interface FlatAccountFields<
  T extends OauthTokenInfo | PersonalAccessKeyTokenInfo
> extends CLIAccount {
  tokenInfo?: T;
  clientId?: string;
  clientSecret?: string;
  scopes?: Array<string>;
  apiKey?: string;
  personalAccessKey?: string;
}
