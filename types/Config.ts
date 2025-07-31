import { ENVIRONMENTS } from '../constants/environments';
import { CLIAccount_NEW, CLIAccount_DEPRECATED } from './Accounts';
import { CmsPublishMode } from './Files';
import { ValueOf } from './Utils';

export interface CLIConfig_NEW {
  accounts: Array<CLIAccount_NEW>;
  allowUsageTracking?: boolean;
  allowAutoUpdates?: boolean;
  defaultAccount?: string | number;
  defaultMode?: CmsPublishMode; // Deprecated - left in to handle existing configs with this field
  defaultCmsPublishMode?: CmsPublishMode;
  httpTimeout?: number;
  env?: Environment;
  httpUseLocalhost?: boolean;
  autoOpenLocalDevSessionInBrowser?: boolean;
}

export interface CLIConfig_DEPRECATED {
  portals: Array<CLIAccount_DEPRECATED>;
  allowUsageTracking?: boolean;
  allowAutoUpdates?: boolean;
  defaultPortal?: string | number;
  defaultMode?: CmsPublishMode; // Deprecated - left in to handle existing configs with this field
  defaultCmsPublishMode?: CmsPublishMode;
  httpTimeout?: number;
  env?: Environment;
  httpUseLocalhost?: boolean;
  autoOpenLocalDevSessionInBrowser?: boolean;
}

export type CLIConfig = CLIConfig_NEW | CLIConfig_DEPRECATED;

export type Environment = ValueOf<typeof ENVIRONMENTS> | '';

export type EnvironmentConfigVariables = {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  personalAccessKey?: string;
  accountId?: number;
  refreshToken?: string;
  env?: Environment;
};

export type GitInclusionResult = {
  inGit: boolean;
  configIgnored: boolean;
  gitignoreFiles: Array<string>;
};
