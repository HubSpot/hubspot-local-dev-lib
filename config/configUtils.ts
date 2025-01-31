import path from 'path';
import os from 'os';
import fs from 'fs';
import yaml from 'js-yaml';

import {
  HUBSPOT_CONFIGURATION_FOLDER,
  HUBSPOT_CONFIGURATION_FILE,
} from '../constants/config';
import { HubSpotConfig, DeprecatedHubSpotConfigFields } from '../types/Config';
import { FileSystemError } from '../models/FileSystemError';
import { logger } from '../lib/logger';

export function getGlobalConfigFilePath(): string {
  return path.join(
    os.homedir(),
    HUBSPOT_CONFIGURATION_FOLDER,
    HUBSPOT_CONFIGURATION_FILE
  );
}

export function readConfigFile(configPath: string): string {
  let source = '';

  try {
    source = fs.readFileSync(configPath).toString();
  } catch (err) {
    logger.debug('@TODO Error reading');
    throw new FileSystemError(
      { cause: err },
      {
        filepath: configPath,
        operation: 'read',
      }
    );
  }

  return source;
}

export function normalizeParsedConfig(
  parsedConfig: HubSpotConfig & DeprecatedHubSpotConfigFields
): HubSpotConfig {
  if (parsedConfig.portals) {
    parsedConfig.accounts = parsedConfig.portals.map(account => {
      account.accountId = account.portalId;
      return account;
    });
  }

  if (parsedConfig.defaultPortal) {
    parsedConfig.defaultAccount = parsedConfig.defaultPortal;
  }

  if (parsedConfig.defaultMode) {
    parsedConfig.defaultCmsPublishMode = parsedConfig.defaultMode;
  }

  return parsedConfig;
}

export function parseConfig(configSource: string): HubSpotConfig {
  let parsedYaml: HubSpotConfig & DeprecatedHubSpotConfigFields;

  try {
    parsedYaml = yaml.load(configSource) as HubSpotConfig &
      DeprecatedHubSpotConfigFields;
  } catch (err) {
    throw new Error('@TODO Error parsing', { cause: err });
  }

  return normalizeParsedConfig(parsedYaml);
}
