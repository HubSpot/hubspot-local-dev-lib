import { AuthTypes } from '../types/Accounts';

export const API_KEY_AUTH_METHOD = {
  value: 'apikey' as AuthTypes.APIKey,
  name: 'API Key',
} as const;

export const OAUTH_AUTH_METHOD = {
  value: 'oauth2' as AuthTypes.OAuth,
  name: 'OAuth2',
} as const;

export const PERSONAL_ACCESS_KEY_AUTH_METHOD = {
  value: 'personalaccesskey' as AuthTypes.PersonalAccessKey,
  name: 'Personal Access Key',
} as const;

export const DEFAULT_OAUTH_SCOPES = ['content'] as const;

export const OAUTH_SCOPES = [
  {
    name: 'All CMS APIs, Calendar API, Email and Email Events APIs',
    value: 'content',
    checked: true,
  },
  {
    name: 'HubDB API',
    value: 'hubdb',
  },
  {
    name: 'File Manager API',
    value: 'files',
  },
] as const;
