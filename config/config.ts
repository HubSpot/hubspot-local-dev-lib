import fs from 'fs';
import findup from 'findup-sync';

import { DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME } from '../constants/config';
import { HubSpotConfigAccount } from '../types/Accounts';
import { HubSpotConfig, Environment, ConfigFlag } from '../types/Config';
import { CmsPublishMode } from '../types/Files';
import { logger } from '../lib/logger';
import { i18n } from '../utils/lang';
import {
  getGlobalConfigFilePath,
  readConfigFile,
  parseConfig,
  loadConfigFromEnvironment,
} from './configUtils';

export function getConfigFilePath(): string {
  const globalConfigFilePath = getGlobalConfigFilePath();

  if (fs.existsSync(globalConfigFilePath)) {
    return globalConfigFilePath;
  }

  const localConfigPath = findup([
    DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
    DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME.replace('.yml', '.yaml'),
  ]);

  if (!localConfigPath) {
    throw new Error('@TODO');
  }

  return localConfigPath;
}

export function getConfig(
  configFilePath?: string,
  useEnv = false
): HubSpotConfig {
  if (configFilePath && useEnv) {
    throw new Error('@TODO');
  }

  if (useEnv) {
    return loadConfigFromEnvironment();
  }

  const pathToRead = configFilePath || getConfigFilePath();

  logger.debug(`@TODOReading config from ${pathToRead}`);
  const configFileSource = readConfigFile(pathToRead);

  return parseConfig(configFileSource);
}

function isConfigValid(config: HubSpotConfig): boolean {}

function createEmptyConfigFile(): void {}

function deleteConfigFile(): void {}

function getConfigAccountById(accountId: number): HubSpotConfigAccount {}

function getConfigAccountByName(accountName: string): HubSpotConfigAccount {}

function getConfigDefaultAccount(): HubSpotConfigAccount {}

function getAllConfigAccounts(): HubSpotConfigAccount[];

function getAccountEnvironmentById(accountId: number): Environment {}

function getDefaultAccountEnvironment(): Environment {}

function updateConfigAccount(
  accoundId: number,
  fieldsToUpdate: object
): HubSpotConfigAccount {}

function setConfigAccountAsDefault(accountId: number): void {}

function renameConfigAccount(accountId: number, newName: string): void {}

function removeAccountFromConfig(accountId: number): void {}

function updateHttpTimeout(timeout: number): void {}

function updateAllowUsageTracking(isAllowed: boolean): void {}

function updateDefaultCmsPublishMode(cmsPublishMode: CmsPublishMode): void {}

function isConfigFlagEnabled(flag: ConfigFlag): boolean {}

function isUsageTrackingAllowed(): boolean {}
