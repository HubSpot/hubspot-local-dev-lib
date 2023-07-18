import { ENVIRONMENTS } from '../constants/environments';
import { CLIAccount, CLIAccount_DEPRECATED } from './Accounts';
import { ValueOf } from './Utils';

export interface CLIConfig {
  accounts: Array<CLIAccount>;
  allowUsageTracking?: boolean;
  defaultAccount?: string | number;
  defaultMode?: string;
  httpTimeout?: number;
  env?: Environment;
  httpUseLocalhost?: boolean;
}

export interface CLIConfig_DEPRECATED {
  portals: Array<CLIAccount_DEPRECATED>;
  allowUsageTracking?: boolean;
  defaultPortal?: string | number;
  defaultMode?: string;
  httpTimeout?: number;
  env?: Environment;
  httpUseLocalhost?: boolean;
}

export type Environment = ValueOf<typeof ENVIRONMENTS> | '';
