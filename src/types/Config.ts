import { CLIAccount } from './Accounts';

export interface CLIConfig {
  accounts: Array<CLIAccount>;
  allowUsageTracking?: boolean;
  defaultAccount?: string;
  defaultMode?: string;
  httpTimeout?: number;
  env?: string;
}
