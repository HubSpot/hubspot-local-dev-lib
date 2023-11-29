import { ENVIRONMENTS } from '../constants/environments';
import { CLIAccount_NEW, CLIAccount_DEPRECATED } from './CLIAccount';
import { ValueOf } from './Utils';

export interface CLIConfig_NEW {
  accounts: Array<CLIAccount_NEW>;
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

export type CLIConfig = CLIConfig_NEW | CLIConfig_DEPRECATED;

export type Environment = ValueOf<typeof ENVIRONMENTS> | '';
