export const API_KEY_AUTH_METHOD = {
  value: 'apikey',
  name: 'API Key',
} as const;

export const OAUTH_AUTH_METHOD = {
  value: 'oauth2',
  name: 'OAuth2',
} as const;

export const PERSONAL_ACCESS_KEY_AUTH_METHOD = {
  value: 'personalaccesskey',
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

export const AUTH_METHODS = {
  api: API_KEY_AUTH_METHOD,
  oauth: OAUTH_AUTH_METHOD,
};

export const SCOPE_GROUPS = {
  CMS_FUNCTIONS: 'cms.functions.read_write',
};
