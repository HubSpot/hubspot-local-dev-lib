import { CLIAccount } from '../types/Accounts';
import {
  CLIConfig,
  CLIConfig_DEPRECATED,
  CLIConfig_NEW,
} from '../types/Config';

export function getAccounts(config?: CLIConfig | null): Array<CLIAccount> {
  if (!config) {
    return [];
  } else if (Object.hasOwn(config, 'portals')) {
    return (config as CLIConfig_DEPRECATED).portals;
  } else if (Object.hasOwn(config, 'accounts')) {
    return (config as CLIConfig_NEW).accounts;
  }
  return [];
}

export function getDefaultAccount(
  config?: CLIConfig | null
): string | number | undefined {
  if (!config) {
    return undefined;
  } else if (Object.hasOwn(config, 'defaultPortal')) {
    return (config as CLIConfig_DEPRECATED).defaultPortal;
  } else if (Object.hasOwn(config, 'defaultAccount')) {
    return (config as CLIConfig_NEW).defaultAccount;
  }
}
