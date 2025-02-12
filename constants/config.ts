import { i18n } from '../utils/lang';

export const DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME = 'hubspot.config.yml';

export const HUBSPOT_CONFIGURATION_FOLDER = '.hscli';
export const HUBSPOT_CONFIGURATION_FILE = 'config.yml';

export const DEFAULT_ACCOUNT_OVERRIDE_FILE_NAME = '.hsaccount';
export const DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID =
  'DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID';
export const DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND =
  'DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND';

export const MIN_HTTP_TIMEOUT = 3000;

export const HUBSPOT_ACCOUNT_TYPES = {
  DEVELOPMENT_SANDBOX: 'DEVELOPMENT_SANDBOX',
  DEVELOPER_TEST: 'DEVELOPER_TEST',
  APP_DEVELOPER: 'APP_DEVELOPER',
  STANDARD_SANDBOX: 'STANDARD_SANDBOX',
  STANDARD: 'STANDARD',
} as const;

export const HUBSPOT_ACCOUNT_TYPE_STRINGS = {
  DEVELOPMENT_SANDBOX: i18n('lib.accountTypes.developmentSandbox'),
  STANDARD_SANDBOX: i18n('lib.accountTypes.standardSandbox'),
  DEVELOPER_TEST: i18n('lib.accountTypes.developerTest'),
  APP_DEVELOPER: i18n('lib.accountTypes.appDeveloper'),
  STANDARD: i18n('lib.accountTypes.standard'),
} as const;

export const CONFIG_FLAGS = {
  USE_CUSTOM_OBJECT_HUBFILE: 'useCustomObjectHubfile',
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
