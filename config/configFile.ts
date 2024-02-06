import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { logger } from '../lib/logging/logger';
import { throwFileSystemError } from '../errors/fileSystemErrors';
import { throwError, throwErrorWithMessage } from '../errors/standardErrors';
import {
  HUBSPOT_CONFIGURATION_FILE,
  HUBSPOT_CONFIGURATION_FOLDER,
} from '../constants/config';
import { getOrderedConfig } from './configUtils';
import { CLIConfig_NEW } from '../types/Config';
import { BaseError } from '../types/Error';
import { i18n } from '../utils/lang';

const i18nKey = 'config.configFile';

export function getConfigFilePath(): string {
  return path.join(
    os.homedir(),
    HUBSPOT_CONFIGURATION_FOLDER,
    HUBSPOT_CONFIGURATION_FILE
  );
}

export function configFileExists(): boolean {
  const configPath = getConfigFilePath();
  return !!configPath && fs.existsSync(configPath);
}

export function configFileIsBlank(): boolean {
  const configPath = getConfigFilePath();
  return !!configPath && fs.readFileSync(configPath).length === 0;
}

export function deleteConfigFile(): void {
  const configPath = getConfigFilePath();
  fs.unlinkSync(configPath);
}

/**
 * @throws {Error}
 */
export function readConfigFile(configPath: string): string {
  let source = '';

  try {
    source = fs.readFileSync(configPath).toString();
  } catch (err) {
    logger.debug(i18n(`${i18nKey}.errorReading`, { configPath }));
    throwFileSystemError(err as BaseError, {
      filepath: configPath,
      read: true,
    });
  }

  return source;
}

/**
 * @throws {Error}
 */
export function parseConfig(configSource: string): CLIConfig_NEW {
  let parsed: CLIConfig_NEW;

  try {
    parsed = yaml.load(configSource) as CLIConfig_NEW;
  } catch (err) {
    throwErrorWithMessage(`${i18nKey}.errors.parsing`, {}, err as BaseError);
  }

  return parsed;
}

/**
 * @throws {Error}
 */
export function loadConfigFromFile(): CLIConfig_NEW | null {
  const configPath = getConfigFilePath();

  if (configPath) {
    const source = readConfigFile(configPath);

    if (!source) {
      return null;
    }

    return parseConfig(source);
  }

  logger.debug(i18n(`${i18nKey}.errorLoading`, { configPath }));

  return null;
}

/**
 * @throws {Error}
 */
export function writeConfigToFile(config: CLIConfig_NEW): void {
  let source: string;
  try {
    source = yaml.dump(
      JSON.parse(JSON.stringify(getOrderedConfig(config), null, 2))
    );
  } catch (err) {
    throwError(err as BaseError);
  }
  const configPath = getConfigFilePath();

  try {
    fs.ensureFileSync(configPath);
    fs.writeFileSync(configPath, source);
    logger.debug(i18n(`${i18nKey}.writeSuccess`, { configPath }));
  } catch (err) {
    throwFileSystemError(err as BaseError, {
      filepath: configPath,
      write: true,
    });
  }
}
