import { i18n } from '../utils/lang';

export const DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME = 'hubspot.config.yml';

export const HUBSPOT_CONFIGURATION_FOLDER = '.hubspot-cli';
export const HUBSPOT_CONFIGURATION_FILE = 'config.yml';

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
