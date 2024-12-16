import { ValueOf } from './Utils';
import { ACTIVITY_SOURCE } from '../enums/project';
import { DEPLOY_ACTION, DEPLOY_STATUS } from '../enums/deploy';
import { COMPONENT_TYPES, SUBCOMPONENT_TYPES } from '../enums/build';
import { OptionalError } from './Error';

export type DeployStatus = ValueOf<typeof DEPLOY_STATUS>;

export type SubdeployStatus = {
  action: ValueOf<typeof DEPLOY_ACTION>;
  deployName: string;
  deployType:
    | ValueOf<typeof COMPONENT_TYPES>
    | ValueOf<typeof SUBCOMPONENT_TYPES>;
  errorMessage: string;
  finishedAt: string;
  standardError?: OptionalError;
  startedAt: string;
  status: DeployStatus;
  id: string;
  visible: boolean;
};

export type Deploy = {
  buildId: number;
  deployId: number;
  enqueuedAt: string;
  finishedAt: string;
  portalId: number;
  projectName: string;
  startedAt: string;
  status: DeployStatus;
  subdeployStatuses: Array<SubdeployStatus>;
  userId: number;
  source: ValueOf<typeof ACTIVITY_SOURCE>;
};

export type DeployStatusTaskLocator = {
  id: string;
  links: Array<{ status: string }>;
};

export type ProjectDeployResponse = {
  id: string;
  links: { status: string };
};
