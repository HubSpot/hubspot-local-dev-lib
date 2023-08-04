import { ValueOf } from './Utils';
import {
  BUILD_STATUS,
  SUBBUILD_TYPES,
  DEPLOYABLE_STATES,
} from '../enums/build';
import { ActivitySource } from './Activity';
import { DeployStatusTaskLocator } from './Deploy';
import { OptionalError } from './Error';

export type SubbuildStatus = {
  buildName: string;
  buildType: ValueOf<typeof SUBBUILD_TYPES>;
  errorMessage: string;
  finishedAt: string;
  rootPath: string;
  standardError?: OptionalError;
  startedAt: string;
  status: ValueOf<typeof BUILD_STATUS>;
  id: string;
};

export type Build = {
  activitySource: ActivitySource;
  buildId: number;
  createdAt: string;
  deployableState: ValueOf<typeof DEPLOYABLE_STATES>;
  deployStatusTaskLocator: DeployStatusTaskLocator;
  enqueuedAt: string;
  finishedAt: string;
  isAutoDeployEnabled: boolean;
  portalId: number;
  projectName: string;
  startedAt: string;
  status: ValueOf<typeof BUILD_STATUS>;
  subbuildStatuses: Array<SubbuildStatus>;
  uploadMessage: string;
};

export type BuildComponentStructure = {
  [key: string]: Array<string>;
};

export type BuildComponentStructureResponse = {
  topLevelComponentsWithChildren: BuildComponentStructure;
};

export type FetchProjectBuildsResponse = {
  results: Array<Build>;
  paging: {
    next: {
      after: string;
      link: string;
    };
  };
};
