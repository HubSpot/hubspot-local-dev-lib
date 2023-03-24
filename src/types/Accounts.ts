export enum AuthTypes {
  PersonalAccessKey = 'personalaccesskey',
  APIKey = 'apikey',
  OAuth = 'oauth2',
}

interface BaseCLIAccount {
  name?: string;
  accountId: number;
  defaultMode?: string;
  env?: string;
  authType?: AuthTypes;
  auth?: object;
  sandboxAccountType?: string | null;
  parentAccountId?: number | null;
}

export interface PersonalAccessKeyAccount extends BaseCLIAccount {
  authType: AuthTypes.PersonalAccessKey;
  auth?: {
    tokenInfo: {
      accessToken: string;
      expiresAt: string;
    };
  };
  personalAccessKey: string;
}

export interface OAuthAccount extends BaseCLIAccount {
  authType: AuthTypes.OAuth;
  auth?: {
    clientId?: string;
    clientSecret?: string;
    scopes?: Array<string>;
    tokenInfo?: {
      refreshToken?: string;
    };
  };
}

export interface APIKeyAccount extends BaseCLIAccount {
  authType: AuthTypes.APIKey;
  apiKey: string;
}

export type CLIAccount =
  | PersonalAccessKeyAccount
  | OAuthAccount
  | APIKeyAccount;

export interface FlatAccountFields extends BaseCLIAccount {
  tokenInfo?:
    | {
        accessToken: string;
        expiresAt: string;
      }
    | {
        refreshToken?: string;
      };
  clientId?: string;
  clientSecret?: string;
  scopes?: Array<string>;
  apiKey?: string;
  personalAccessKey?: string;
}
