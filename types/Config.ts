import { ENVIRONMENTS } from '../constants/environments';
import { CLIAccount } from './Accounts';
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

export type Environment = ValueOf<typeof ENVIRONMENTS> | '';
