import { i18n } from '../utils/lang.js';
import path from 'path';
import os from 'os';
import { getCwd } from '../lib/path.js';

export const DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME = 'hubspot.config.yml';
export const ARCHIVED_HUBSPOT_CONFIG_YAML_FILE_NAME =
  'archived.hubspot.config.yml';

export const HUBSPOT_CONFIGURATION_FOLDER = '.hscli';
export const HUBSPOT_CONFIGURATION_FILE = 'config.yml';
export const HUBSPOT_STATE_FILE = 'state.json';

export const GLOBAL_CONFIG_PATH = path.join(
  os.homedir(),
  HUBSPOT_CONFIGURATION_FOLDER,
  HUBSPOT_CONFIGURATION_FILE
);

export const STATE_FILE_PATH = path.join(
  os.homedir(),
  HUBSPOT_CONFIGURATION_FOLDER,
  HUBSPOT_STATE_FILE
);

export const DEFAULT_ACCOUNT_OVERRIDE_FILE_NAME = '.hsaccount';
export const DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID =
  'DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID';
export const DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND =
  'DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND';

/**
 * @deprecated Use CONFIG_FLAGS.DEFAULT_CMS_PUBLISH_MODE instead
 */
export const DEFAULT_CMS_PUBLISH_MODE = 'defaultCmsPublishMode';
/**
 * @deprecated Use CONFIG_FLAGS.HTTP_TIMEOUT instead
 */
export const HTTP_TIMEOUT = 'httpTimeout';
/**
 * @deprecated Use CONFIG_FLAGS.HTTP_USE_LOCALHOST instead
 */
export const HTTP_USE_LOCALHOST = 'httpUseLocalhost';
/**
 * @deprecated Use CONFIG_FLAGS.ALLOW_USAGE_TRACKING instead
 */
export const ALLOW_USAGE_TRACKING = 'allowUsageTracking';
/**
 * @deprecated Use CONFIG_FLAGS.AUTO_OPEN_BROWSER instead
 */
export const AUTO_OPEN_BROWSER = 'autoOpenBrowser';
/**
 * @deprecated Use CONFIG_FLAGS.ALLOW_AUTO_UPDATES instead
 */
export const ALLOW_AUTO_UPDATES = 'allowAutoUpdates';
export const ENV = 'env';
export const DEFAULT_ACCOUNT = 'defaultAccount';
export const DEFAULT_PORTAL = 'defaultPortal';
export const MIN_HTTP_TIMEOUT = 3000;
/**
 * @deprecated Use STATE_FLAGS.MCP_TOTAL_TOOL_CALLS instead
 */
export const MCP_TOTAL_TOOL_CALLS_STATE = 'mcpTotalToolCalls';

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

export const STATE_FLAGS = {
  MCP_TOTAL_TOOL_CALLS: 'mcpTotalToolCalls',
} as const;

export const CONFIG_FLAGS = {
  DEFAULT_CMS_PUBLISH_MODE: 'defaultCmsPublishMode',
  USE_CUSTOM_OBJECT_HUBFILE: 'useCustomObjectHubfile',
  HTTP_USE_LOCALHOST: 'httpUseLocalhost',
  HTTP_TIMEOUT: 'httpTimeout',
  ALLOW_AUTO_UPDATES: 'allowAutoUpdates',
  ALLOW_USAGE_TRACKING: 'allowUsageTracking',
  AUTO_OPEN_BROWSER: 'autoOpenBrowser',
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
  USE_ENVIRONMENT_HUBSPOT_CONFIG: 'USE_ENVIRONMENT_HUBSPOT_CONFIG',
  HUBSPOT_CONFIG_PATH: 'HUBSPOT_CONFIG_PATH',
} as const;

export const ACCOUNT_IDENTIFIERS = {
  ACCOUNT_ID: 'accountId',
  NAME: 'name',
} as const;

export const HUBSPOT_CONFIG_ERROR_TYPES = {
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  NO_DEFAULT_ACCOUNT: 'NO_DEFAULT_ACCOUNT',
  INVALID_ENVIRONMENT_VARIABLES: 'ENVIRONMENT_VARIABLES',
  YAML_PARSING: 'YAML_PARSING',
  INVALID_ACCOUNT: 'INVALID_ACCOUNT',
  INVALID_FIELD: 'INVALID_FIELD',
  UNKNOWN: 'UNKNOWN',
} as const;

export const HUBSPOT_CONFIG_OPERATIONS = {
  READ: 'READ',
  WRITE: 'WRITE',
  DELETE: 'DELETE',
} as const;

export const HS_FOLDER = '.hs';
export const HS_SETTINGS_FILENAME = 'settings.json';
export const HS_SETTINGS_PATH = path.join(
  getCwd(),
  HS_FOLDER,
  HS_SETTINGS_FILENAME
);
