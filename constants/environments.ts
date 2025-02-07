export const ENVIRONMENTS = {
  PROD: 'prod',
  QA: 'qa',
} as const;

export const ENVIRONMENT_VARIABLES = {
  HUBSPOT_API_KEY: 'HUBSPOT_API_KEY',
  HUBSPOT_CLIENT_ID: 'HUBSPOT_CLIENT_ID',
  HUBSPOT_CLIENT_SECRET: 'HUBSPOT_CLIENT_SECRET',
  HUBSPOT_PERSONAL_ACCESS_KEY: 'HUBSPOT_PERSONAL_ACCESS_KEY',
  HUBSPOT_ACCOUNT_ID: 'HUBSPOT_ACCOUNT_ID',
  HUBSPOT_PORTAL_ID: 'HUBSPOT_PORTAL_ID',
  HUBSPOT_REFRESH_TOKEN: 'HUBSPOT_REFRESH_TOKEN',
  HUBSPOT_ENVIRONMENT: 'HUBSPOT_ENVIRONMENT',
  HTTP_TIMEOUT: 'HTTP_TIMEOUT',
  HTTP_USE_LOCALHOST: 'HTTP_USE_LOCALHOST',
  ALLOW_USAGE_TRACKING: 'ALLOW_USAGE_TRACKING',
  DEFAULT_CMS_PUBLISH_MODE: 'DEFUALT_CMS_PUBLISH_MODE',
  USE_ENVIRONMENT_CONFIG: 'USE_ENVIRONMENT_CONFIG',
  HUBSPOT_CONFIG_PATH: 'HUBSPOT_CONFIG_PATH',
} as const;
