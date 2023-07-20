import * as config_DEPRECATED from './config_DEPRECATED';
import CLIConfiguration from './CLIConfiguration';
import { configFileExists, getConfigFilePath } from './configFile';
import {
  CLIConfig_NEW,
  CLIConfig_DEPRECATED,
  CLIConfig,
} from '../types/Config';
import { CLIOptions } from '../types/CLIOptions';

// This file is used to maintain backwards compatiblity for the legacy hubspot.config.yml config.
// If the hubspot.config.yml file exists, we will fall back to legacy behavior. Otherwise we will
// use the new root config handling.

// NOTE This is gross. Everything in the code uses portalId, but that's an outdated term
// Ideally we can slowly switch to accountId, but that means we need to convert back to
// portalId while we're still supporting the legacy config.
function withPortals(config?: CLIConfig_NEW): CLIConfig_DEPRECATED | undefined {
  if (config) {
    const configWithPortals: CLIConfig_DEPRECATED = { ...config, portals: [] };

    if (config.defaultAccount) {
      configWithPortals.defaultPortal = config.defaultAccount;
    }
    if (config.accounts) {
      configWithPortals.portals = config.accounts.map(account => {
        const { accountId, ...rest } = account;
        return { ...rest, portalId: accountId };
      });
    }
    return configWithPortals;
  }
  return config;
}

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

const loadConfigFromEnvironment = () => {
  if (CLIConfig.active) {
    return CLIConfig.useEnvConfig;
  }
  return legacyConfig.loadConfigFromEnvironment();
};

const createEmptyConfigFile = (...args) => {
  // TODO hs init has not loaded config yet so this will never be active
  if (CLIConfig.active) {
    return CLIConfig.write({ accounts: [] });
  }
  return legacyConfig.createEmptyConfigFile(...args);
};

const deleteEmptyConfigFile = () => {
  if (CLIConfig.active) {
    return CLIConfig.delete();
  }
  return legacyConfig.deleteEmptyConfigFile();
};

const getConfig = () => {
  if (CLIConfig.active) {
    return withPortals(CLIConfig.config);
  }
  return legacyConfig.getConfig();
};

const writeConfig = (options = {}) => {
  if (CLIConfig.active) {
    const config = options.source ? JSON.parse(options.source) : undefined;
    return CLIConfig.write(config);
  }
  return legacyConfig.writeConfig(options);
};

const getConfigPath = () => {
  if (CLIConfig.active) {
    return getConfigFilePath();
  }
  return legacyConfig.getConfigPath();
};

const getAccountConfig = accountId => {
  if (CLIConfig.active) {
    return CLIConfig.getConfigForAccount(accountId);
  }
  return legacyConfig.getAccountConfig(accountId);
};

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
