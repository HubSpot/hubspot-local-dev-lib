import { CLIAccount } from './Accounts';

export interface CLIConfig {
  accounts: Array<CLIAccount>;
  allowUsageTracking?: boolean;
  defaultAccount?: string | number;
  defaultMode?: string;
  httpTimeout?: number;
  env?: string;
}
