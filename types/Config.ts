import { CONFIG_FLAGS } from '../constants/config';
import { ENVIRONMENTS } from '../constants/environments';
import {
  DeprecatedHubSpotConfigAccountFields,
  HubSpotConfigAccount,
} from './Accounts';
import { CmsPublishMode } from './Files';
import { ValueOf } from './Utils';

export interface HubSpotConfig {
  accounts: Array<HubSpotConfigAccount>;
  allowUsageTracking?: boolean;
  defaultAccount?: number;
  defaultCmsPublishMode?: CmsPublishMode;
  httpTimeout?: number;
  env?: Environment;
  httpUseLocalhost?: boolean;
  useCustomObjectHubfile?: boolean;
}

export type DeprecatedHubSpotConfigFields = {
  portals?: Array<HubSpotConfigAccount & DeprecatedHubSpotConfigAccountFields>;
  defaultPortal?: string;
  defaultMode?: CmsPublishMode;
};

// export interface CLIConfig_DEPRECATED {
//   portals: Array<CLIAccount_DEPRECATED>;
//   allowUsageTracking?: boolean;
//   defaultPortal?: string | number;
//   defaultMode?: CmsPublishMode; // Deprecated - left in to handle existing configs with this field
//   defaultCmsPublishMode?: CmsPublishMode;
//   httpTimeout?: number;
//   env?: Environment;
//   httpUseLocalhost?: boolean;
// }

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

export type ConfigFlag = ValueOf<typeof CONFIG_FLAGS>;
