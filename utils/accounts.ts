import { CLIAccount } from '../types/Accounts';
import {
  CLIConfig,
  CLIConfig_DEPRECATED,
  CLIConfig_NEW,
} from '../types/Config';

export function getAccounts(config?: CLIConfig | null): Array<CLIAccount> {
  if (!config) {
    return [];
  } else if ('portals' in config && Array.isArray(config.portals)) {
    return config.portals;
  } else if ('accounts' in config && Array.isArray(config.accounts)) {
    return config.accounts;
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
