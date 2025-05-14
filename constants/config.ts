import { i18n } from '../utils/lang';
import path from 'path';
import os from 'os';

export const DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME = 'hubspot.config.yml';
export const ARCHIVED_HUBSPOT_CONFIG_YAML_FILE_NAME =
  'archived.hubspot.config.yml';

export const HUBSPOT_CONFIGURATION_FOLDER = '.hscli';
export const HUBSPOT_CONFIGURATION_FILE = 'config.yml';

export const GLOBAL_CONFIG_PATH = path.join(
  os.homedir(),
  HUBSPOT_CONFIGURATION_FOLDER,
  HUBSPOT_CONFIGURATION_FILE
);

export const DEFAULT_ACCOUNT_OVERRIDE_FILE_NAME = '.hsaccount';
export const DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID =
  'DEFAULT_ACCOUNT_OVERRIDE_ERROR_INVALID_ID';
export const DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND =
  'DEFAULT_ACCOUNT_OVERRIDE_ERROR_ACCOUNT_NOT_FOUND';

export const DEFAULT_CMS_PUBLISH_MODE = 'defaultCmsPublishMode';
export const HTTP_TIMEOUT = 'httpTimeout';
export const ENV = 'env';
export const HTTP_USE_LOCALHOST = 'httpUseLocalhost';
export const ALLOW_USAGE_TRACKING = 'allowUsageTracking';
export const DEFAULT_ACCOUNT = 'defaultAccount';
export const DEFAULT_PORTAL = 'defaultPortal';

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
