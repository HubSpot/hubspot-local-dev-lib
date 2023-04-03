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
import { CLIAccount } from '../types/Accounts';
import { CLIConfig } from '../types/Config';
import { BaseError } from '../types/Error';
import { CLIOptions } from '../types/CLIOptions';

function getConfigFilePath(): string {
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

function getOrderedAccount(unorderedAccount: CLIAccount): CLIAccount {
  const { name, accountId, env, authType, ...rest } = unorderedAccount;

  return {
    name,
    accountId,
    env,
    authType,
    ...rest,
  };
}

function getOrderedConfig(unorderedConfig: CLIConfig): CLIConfig {
  const {
    defaultAccount,
    defaultMode,
    httpTimeout,
    allowUsageTracking,
    accounts,
    ...rest
  } = unorderedConfig;

  return {
    ...(defaultAccount && { defaultAccount }),
    defaultMode,
    httpTimeout,
    allowUsageTracking,
    ...rest,
    accounts: accounts.map(getOrderedAccount),
  };
}

function readConfigFile(configPath: string): {
  source: string;
  error: BaseError | undefined;
} {
  let source = '';
  let error: BaseError | undefined;

  try {
    source = fs.readFileSync(configPath).toString();
  } catch (err) {
    error = err as BaseError;
    debug('config.errorReading', { configPath });
    throwFileSystemError(error, {
      filepath: configPath,
      read: true,
    });
  }
  return { source, error };
}

function parseConfig(configSource: string): {
  parsed: CLIConfig;
  error: BaseError | undefined;
} {
  let parsed: CLIConfig;
  let error: BaseError | undefined;

  try {
    parsed = yaml.load(configSource) as CLIConfig;
  } catch (err) {
    error = err as BaseError;
    debug('config.errorParsing');
    throwError(error);
  }
  return { parsed, error };
}

export function loadConfigFromFile(options: CLIOptions): CLIConfig | null {
  const configPath = getConfigFilePath();

  if (configPath) {
    const { source, error: readError } = readConfigFile(configPath);

    if (readError || !source) {
      return null;
    }
    const { parsed, error: parseError } = parseConfig(source);

    if (parseError) {
      return null;
    }
    return parsed;
  }

  // TODO Handle this with a custom logger to pass in (logger vs debug?
  const errorFunc = options.silenceErrors ? debug : debug;
  errorFunc(`A configuration file could not be found at ${configPath}.`);
  return null;
}

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
    debug('config.writeSuccess', { configPath });
  } catch (err) {
    throwFileSystemError(err as BaseError, {
      filepath: configPath,
      write: true,
    });
  }
}
