// NOTE this is the legacy config file name (We still need to keep it around though)
export const DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME = 'hubspot.config.yml';

export const HUBSPOT_CONFIGURATION_FOLDER = '.hubspot';
export const HUBSPOT_CONFIGURATION_FILE = 'config.yml';

export const DEFAULT_MODES = {
  draft: 'draft',
  publish: 'publish',
} as const;

export const MIN_HTTP_TIMEOUT = 3000;
