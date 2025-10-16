import fs from 'fs-extra';
import yaml from 'js-yaml';
import { logger } from '../lib/logger.js';
import { GLOBAL_CONFIG_PATH } from '../constants/config.js';
import { getOrderedConfig } from './configUtils.js';
import { CLIConfig_NEW } from '../types/Config.js';
import { i18n } from '../utils/lang.js';
import { FileSystemError } from '../models/FileSystemError.js';

const i18nKey = 'config.configFile';

export function getConfigFilePath(): string {
  return GLOBAL_CONFIG_PATH;
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

/**
 * @throws {Error}
 */
export function parseConfig(configSource: string): CLIConfig_NEW {
  let parsed: CLIConfig_NEW;

  try {
    parsed = yaml.load(configSource) as CLIConfig_NEW;
  } catch (err) {
    throw new Error(i18n(`${i18nKey}.errors.parsing`), { cause: err });
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
  const source = yaml.dump(
    JSON.parse(JSON.stringify(getOrderedConfig(config), null, 2))
  );
  const configPath = getConfigFilePath();

  try {
    fs.ensureFileSync(configPath);
    fs.writeFileSync(configPath, source);
    logger.debug(i18n(`${i18nKey}.writeSuccess`, { configPath }));
  } catch (err) {
    throw new FileSystemError(
      { cause: err },
      {
        filepath: configPath,
        operation: 'write',
      }
    );
  }
}
