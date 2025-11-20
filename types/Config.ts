import {
  CONFIG_FLAGS,
  HUBSPOT_CONFIG_ERROR_TYPES,
  HUBSPOT_CONFIG_OPERATIONS,
} from '../constants/config';
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
  allowAutoUpdates?: boolean;
  defaultAccount?: number;
  defaultMode?: CmsPublishMode; // Deprecated - left in to handle existing configs with this field
  defaultCmsPublishMode?: CmsPublishMode;
  httpTimeout?: number;
  env?: Environment;
  httpUseLocalhost?: boolean;
  autoOpenBrowser?: boolean;
  useCustomObjectHubfile?: boolean;
  flags?: Array<string>;
}

export type DeprecatedHubSpotConfigFields = {
  portals?: Array<HubSpotConfigAccount & DeprecatedHubSpotConfigAccountFields>;
  defaultPortal?: string;
  defaultMode?: CmsPublishMode;
};

export type Environment = ValueOf<typeof ENVIRONMENTS> | '';

export type GitInclusionResult = {
  inGit: boolean;
  configIgnored: boolean;
  gitignoreFiles: Array<string>;
};

export type ConfigFlag = ValueOf<typeof CONFIG_FLAGS>;

export type HubSpotState = {
  mcpTotalToolCalls: number;
};

export type HubSpotConfigErrorType = ValueOf<typeof HUBSPOT_CONFIG_ERROR_TYPES>;

export type HubSpotConfigOperation = ValueOf<typeof HUBSPOT_CONFIG_OPERATIONS>;

export type HubSpotConfigValidationResult = {
  isValid: boolean;
  errors: Array<string>;
};
