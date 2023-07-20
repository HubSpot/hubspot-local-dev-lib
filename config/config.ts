import * as config_DEPRECATED from './config_DEPRECATED';
import CLIConfiguration from './CLIConfiguration';
import { configFileExists, getConfigFilePath } from './configFile';
import {
  CLIConfig_NEW,
  CLIConfig_DEPRECATED,
  CLIConfig,
} from '../types/Config';
import { CLIOptions, WriteConfigOptions } from '../types/CLIOptions';

// Prioritize using the new config if it exists
function loadConfig(path: string, options: CLIOptions = {}): CLIConfig | null {
  // Attempt to load the root config
  if (configFileExists()) {
    return CLIConfiguration.init(options);
  }
  const deprecatedConfig = config_DEPRECATED.loadConfig(path, options);

  if (deprecatedConfig) {
    return deprecatedConfig;
  }

  // There are no config files, set the CLIConfig to active so
  // we use the new behavior by default.
  return CLIConfiguration.init(options);
}

function getAndLoadConfigIfNeeded(
  options: CLIOptions
): Partial<CLIConfig> | null {
  if (CLIConfiguration.active) {
    return CLIConfiguration.config;
  }
  return config_DEPRECATED.getAndLoadConfigIfNeeded(options);
}

function validateConfig(): boolean {
  if (CLIConfiguration.active) {
    return CLIConfiguration.validate();
  }
  return config_DEPRECATED.validateConfig();
}

function loadConfigFromEnvironment(): boolean {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.useEnvConfig;
  }
  return Boolean(config_DEPRECATED.loadConfigFromEnvironment());
}

function createEmptyConfigFile(
  options: { path?: string } = {},
  useRootConfig = false
): void {
  if (useRootConfig) {
    CLIConfiguration.write({ accounts: [] });
  }
  return config_DEPRECATED.createEmptyConfigFile(options);
}

function deleteEmptyConfigFile() {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.delete();
  }
  return config_DEPRECATED.deleteEmptyConfigFile();
}

function getConfig(): CLIConfig | null {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.config;
  }
  return config_DEPRECATED.getConfig();
}

function writeConfig(options: WriteConfigOptions = {}): void {
  if (CLIConfiguration.isActive()) {
    const config = options.source
      ? (JSON.parse(options.source) as CLIConfig_NEW)
      : undefined;
    CLIConfiguration.write(config);
  }
  config_DEPRECATED.writeConfig(options);
}

function getConfigPath(path?: string): string | null {
  if (CLIConfiguration.isActive()) {
    return getConfigFilePath();
  }
  return config_DEPRECATED.getConfigPath(path);
}

function getAccountConfig(accountId: number) {
  if (CLIConfig.active) {
    return CLIConfig.getConfigForAccount(accountId);
  }
  return legacyConfig.getAccountConfig(accountId);
}

const accountNameExistsInConfig = (...args) => {
  if (CLIConfig.active) {
    return CLIConfig.isAccountNameInConfig(...args);
  }
  return legacyConfig.accountNameExistsInConfig(...args);
};

const updateAccountConfig = configOptions => {
  if (CLIConfig.active) {
    return CLIConfig.updateConfigForAccount(configOptions);
  }
  return legacyConfig.updateAccountConfig(configOptions);
};

const updateDefaultAccount = (...args) => {
  if (CLIConfig.active) {
    return CLIConfig.updateDefaultAccount(...args);
  }
  return legacyConfig.updateDefaultAccount(...args);
};

const renameAccount = async (...args) => {
  if (CLIConfig.active) {
    return CLIConfig.renameAccount(...args);
  }
  return legacyConfig.renameAccount(...args);
};

const getAccountId = nameOrId => {
  if (CLIConfig.active) {
    return CLIConfig.getAccountId(nameOrId);
  }
  return legacyConfig.getAccountId(nameOrId);
};

const removeSandboxAccountFromConfig = nameOrId => {
  if (CLIConfig.active) {
    return CLIConfig.removeAccountFromConfig(nameOrId);
  }
  return legacyConfig.removeSandboxAccountFromConfig(nameOrId);
};

const deleteAccount = accountName => {
  if (CLIConfig.active) {
    return CLIConfig.removeAccountFromConfig(accountName);
  }
  return legacyConfig.deleteAccount(accountName);
};

const updateHttpTimeout = timeout => {
  if (CLIConfig.active) {
    return CLIConfig.updateHttpTimeout(timeout);
  }
  return legacyConfig.updateHttpTimeout(timeout);
};

const updateAllowUsageTracking = isEnabled => {
  if (CLIConfig.active) {
    return CLIConfig.updateAllowUsageTracking(isEnabled);
  }
  return legacyConfig.updateAllowUsageTracking(isEnabled);
};

const deleteConfigFile = () => {
  if (CLIConfig.active) {
    return configFile.deleteConfigFile();
  }
  return legacyConfig.deleteConfigFile();
};

const isConfigFlagEnabled = flag => {
  if (CLIConfig.active) {
    return configFile.getConfigFlagValue(flag);
  }
  return legacyConfig.isConfigFlagEnabled(flag);
};

const isTrackingAllowed = () => {
  if (CLIConfig.active) {
    return configFile.getConfigFlagValue('allowUsageTracking', true);
  }
  return legacyConfig.isTrackingAllowed();
};

const getEnv = nameOrId => {
  if (CLIConfig.active) {
    return getEnv(nameOrId);
  }
  return legacyConfig.getEnv(nameOrId);
};

module.exports = {
  ...legacyConfig,
  CLIConfig,

  // Override legacy config exports
  accountNameExistsInConfig,
  createEmptyConfigFile,
  deleteAccount,
  deleteConfigFile,
  deleteEmptyConfigFile,
  getAccountConfig,
  getAccountId,
  getAndLoadConfigIfNeeded,
  getConfig,
  getConfigPath,
  getEnv,
  isConfigFlagEnabled,
  isTrackingAllowed,
  loadConfig,
  loadConfigFromEnvironment,
  removeSandboxAccountFromConfig,
  renameAccount,
  updateAccountConfig,
  updateAllowUsageTracking,
  updateDefaultAccount,
  updateHttpTimeout,
  validateConfig,
  writeConfig,
};
