import { ValueOf } from './Utils.js';
import { ACTIVITY_SOURCE } from '../enums/project.js';
import { DEPLOY_ACTION, DEPLOY_STATUS } from '../enums/deploy.js';
import { COMPONENT_TYPES, SUBCOMPONENT_TYPES } from '../enums/build.js';
import { ProjectStandardError } from './ProjectComponents.js';

export type DeployStatus = ValueOf<typeof DEPLOY_STATUS>;

export type SubdeployStatus = {
  action: ValueOf<typeof DEPLOY_ACTION>;
  deployName: string;
  deployType:
    | ValueOf<typeof COMPONENT_TYPES>
    | ValueOf<typeof SUBCOMPONENT_TYPES>;
  errorMessage: string;
  finishedAt: string;
  standardError: ProjectStandardError | null;
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

export type SubdeployValidationIssue = {
  uid: string;
  componentTypeName: string;
  errorMessages: string[];
  blockingMessages: { message: string; isWarning: boolean }[];
};

export type DeployResponseLinks = {
  status: string;
};

export type ProjectDeployResponseQueued = {
  id: string;
  buildResultType: 'DEPLOY_QUEUED';
  links: DeployResponseLinks;
};

export type ProjectDeployResponseBlocked = {
  buildResultType: 'DEPLOY_BLOCKED';
  issues: SubdeployValidationIssue[];
};

export type ProjectDeployResponse =
  | ProjectDeployResponseQueued
  | ProjectDeployResponseBlocked;

export type ProjectDeployResponseV1 = {
  id: string;
  links: DeployResponseLinks;
};
