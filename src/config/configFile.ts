import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { debug } from '../utils/logger';
import { throwFileSystemError } from '../errors/fileSystemErrors';
import { throwError } from '../errors/standardErrors';
import {
  HUBSPOT_CONFIGURATION_FILE,
  HUBSPOT_CONFIGURATION_FOLDER,
} from '../constants';
import { getOrderedConfig } from './configUtils';
import { CLIConfig } from '../types/Config';
import { BaseError } from '../types/Error';

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
    debug(`${i18nKey}.errorReading`, { configPath });
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
export function parseConfig(configSource: string): CLIConfig {
  let parsed: CLIConfig;

  try {
    parsed = yaml.load(configSource) as CLIConfig;
  } catch (err) {
    debug(`${i18nKey}.errorParsing`);
    throwError(err as BaseError);
  }

  return parsed;
}

/**
 * @throws {Error}
 */
export function loadConfigFromFile(): CLIConfig | null {
  const configPath = getConfigFilePath();

  if (configPath) {
    const source = readConfigFile(configPath);

    if (!source) {
      return null;
    }

    return parseConfig(source);
  }

  // TODO: Maybe use log callbacks here
  debug(`${i18nKey}.errorLoading`, { configPath });

  return null;
}

/**
 * @throws {Error}
 */
export function writeConfigToFile(config: CLIConfig): void {
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
    debug(`${i18nKey}.writeSuccess`, { configPath });
  } catch (err) {
    throwFileSystemError(err as BaseError, {
      filepath: configPath,
      write: true,
    });
  }
}
