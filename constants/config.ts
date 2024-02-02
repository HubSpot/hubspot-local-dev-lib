// NOTE this is the legacy config file name (We still need to keep it around though)
export const DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME = 'hubspot.config.yml';

export const HUBSPOT_CONFIGURATION_FOLDER = '.hubspot';
export const HUBSPOT_CONFIGURATION_FILE = 'config.yml';

export const MIN_HTTP_TIMEOUT = 3000;

export const HUBSPOT_ACCOUNT_TYPES = {
  DEVELOPER_SANDBOX: 'DEVELOPER_SANDBOX',
  DEVELOPER_TEST: 'DEVELOPER_TEST',
  DEVELOPER: 'DEVELOPER',
  STANDARD_SANDBOX: 'STANDARD_SANDBOX',
  STANDARD: 'STANDARD',
} as const;
