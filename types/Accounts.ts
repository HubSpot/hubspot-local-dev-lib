import { Mode } from './Files';
import { Environment } from './Config';

export type AuthType = 'personalaccesskey' | 'apikey' | 'oauth2';

export interface CLIAccount_NEW {
  name?: string;
  accountId: number;
  defaultMode?: Mode;
  env: Environment;
  authType?: AuthType;
  auth?: {
    tokenInfo?: TokenInfo;
  };
  sandboxAccountType?: string | null;
  parentAccountId?: number | null;
  apiKey?: string;
  personalAccessKey?: string;
}

export interface CLIAccount_DEPRECATED {
  name?: string;
  portalId?: number;
  defaultMode?: Mode;
  env: Environment;
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

export type TokenInfo = {
  accessToken?: string;
  expiresAt?: string;
  refreshToken?: string;
};

export interface PersonalAccessKeyAccount extends CLIAccount_NEW {
  authType: 'personalaccesskey';
  personalAccessKey: string;
}

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
