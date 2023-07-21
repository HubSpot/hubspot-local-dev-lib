import * as config_DEPRECATED from './config_DEPRECATED';
import CLIConfiguration from './CLIConfiguration';
import {
  configFileExists,
  getConfigFilePath,
  deleteConfigFile as newDeleteConfigFile,
} from './configFile';
import { CLIConfig_NEW, CLIConfig } from '../types/Config';
import { CLIOptions, WriteConfigOptions } from '../types/CLIOptions';
import { CLIAccount, FlatAccountFields } from '../types/Accounts';

// Prioritize using the new config if it exists
export function loadConfig(
  path: string,
  options: CLIOptions = {}
): CLIConfig | null {
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

export function getAndLoadConfigIfNeeded(
  options?: CLIOptions
): Partial<CLIConfig> | null {
  if (CLIConfiguration.active) {
    return CLIConfiguration.config;
  }
  return config_DEPRECATED.getAndLoadConfigIfNeeded(options);
}

export function validateConfig(): boolean {
  if (CLIConfiguration.active) {
    return CLIConfiguration.validate();
  }
  return config_DEPRECATED.validateConfig();
}

export function loadConfigFromEnvironment(): boolean {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.useEnvConfig;
  }
  return Boolean(config_DEPRECATED.loadConfigFromEnvironment());
}

export function createEmptyConfigFile(
  options: { path?: string } = {},
  useRootConfig = false
): void {
  if (useRootConfig) {
    CLIConfiguration.write({ accounts: [] });
  } else {
    return config_DEPRECATED.createEmptyConfigFile(options);
  }
}

export function deleteEmptyConfigFile() {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.delete();
  }
  return config_DEPRECATED.deleteEmptyConfigFile();
}

export function getConfig(): CLIConfig | null {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.config;
  }
  return config_DEPRECATED.getConfig();
}

export function writeConfig(options: WriteConfigOptions = {}): void {
  if (CLIConfiguration.isActive()) {
    const config = options.source
      ? (JSON.parse(options.source) as CLIConfig_NEW)
      : undefined;
    CLIConfiguration.write(config);
  } else {
    config_DEPRECATED.writeConfig(options);
  }
}

export function getConfigPath(path?: string): string | null {
  if (CLIConfiguration.isActive()) {
    return getConfigFilePath();
  }
  return config_DEPRECATED.getConfigPath(path);
}

export function getAccountConfig(accountId: number): CLIAccount | null {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.getConfigForAccount(accountId);
  }
  return config_DEPRECATED.getAccountConfig(accountId) || null;
}

export function accountNameExistsInConfig(name: string): boolean {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.isAccountInConfig(name);
  }
  return config_DEPRECATED.accountNameExistsInConfig(name);
}

export function updateAccountConfig(
  configOptions: Partial<FlatAccountFields>
): FlatAccountFields | null {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.updateAccount(configOptions);
  }
  return config_DEPRECATED.updateAccountConfig(configOptions);
}

export function updateDefaultAccount(nameOrId: string | number): void {
  if (CLIConfiguration.isActive()) {
    CLIConfiguration.updateDefaultAccount(nameOrId);
  } else {
    config_DEPRECATED.updateDefaultAccount(nameOrId);
  }
}

export async function renameAccount(
  currentName: string,
  newName: string
): Promise<void> {
  if (CLIConfiguration.isActive()) {
    CLIConfiguration.renameAccount(currentName, newName);
  } else {
    config_DEPRECATED.renameAccount(currentName, newName);
  }
}

export function getAccountId(nameOrId: string | number): number | null {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.getAccountId(nameOrId);
  }
  return config_DEPRECATED.getAccountId(nameOrId) || null;
}

export function removeSandboxAccountFromConfig(
  nameOrId: string | number
): boolean {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.removeAccountFromConfig(nameOrId);
  }
  return config_DEPRECATED.removeSandboxAccountFromConfig(nameOrId);
}

export async function deleteAccount(accountName: string): Promise<void> {
  if (CLIConfiguration.isActive()) {
    CLIConfiguration.removeAccountFromConfig(accountName);
  } else {
    config_DEPRECATED.deleteAccount(accountName);
  }
}

export function updateHttpTimeout(timeout: string): void {
  if (CLIConfiguration.isActive()) {
    CLIConfiguration.updateHttpTimeout(timeout);
  } else {
    config_DEPRECATED.updateHttpTimeout(timeout);
  }
}

export function updateAllowUsageTracking(isEnabled: boolean): void {
  if (CLIConfiguration.isActive()) {
    CLIConfiguration.updateAllowUsageTracking(isEnabled);
  } else {
    config_DEPRECATED.updateAllowUsageTracking(isEnabled);
  }
}

export function deleteConfigFile(): void {
  if (CLIConfiguration.isActive()) {
    newDeleteConfigFile();
  } else {
    config_DEPRECATED.deleteConfigFile();
  }
}

export function isConfigFlagEnabled(flag: keyof CLIConfig): boolean {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.isConfigFlagEnabled(flag);
  }
  return config_DEPRECATED.isConfigFlagEnabled(flag);
}

export function isTrackingAllowed() {
  if (CLIConfiguration.active) {
    return CLIConfiguration.isTrackingAllowed();
  }
  return config_DEPRECATED.isTrackingAllowed();
}

export function getEnv(nameOrId: string | number) {
  if (CLIConfiguration.isActive()) {
    return CLIConfiguration.getEnv(nameOrId);
  }
  return config_DEPRECATED.getEnv(nameOrId);
}
