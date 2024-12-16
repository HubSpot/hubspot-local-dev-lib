import { ValueOf } from './Utils';
import {
  BUILD_STATUS,
  SUBBUILD_TYPES,
  DEPLOYABLE_STATES,
} from '../enums/build';
import { ActivitySource } from './Activity';
import { DeployStatusTaskLocator } from './Deploy';
import { ProjectStandardError } from './Project';

export type SubbuildStatus = {
  buildName: string;
  buildType: ValueOf<typeof SUBBUILD_TYPES>;
  errorMessage: string;
  finishedAt: string;
  rootPath: string;
  standardError: ProjectStandardError | null;
  startedAt: string;
  status: ValueOf<typeof BUILD_STATUS>;
  id: string;
  visible: boolean;
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
  autoDeployId: number;
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
