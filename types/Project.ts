import { Build } from './Build';
import { GithubSourceData } from './Github';

export type Project = {
  createdAt: number;
  deletedAt: number;
  deployedBuild?: Build;
  deployedBuildId?: number;
  id: number;
  isLocked: boolean;
  latestBuild?: Build;
  name: string;
  portalId: number;
  sourceIntegration?: GithubSourceData;
  updatedAt: number;
};

export type FetchProjectResponse = {
  results: Array<Project>;
};

export type UploadProjectResponse = {
  buildId: number;
  projectTree: {
    path: string;
    name: string;
    parentPath: string;
    updatedAt: number;
    children: Array<UploadProjectResponse>;
    folder: boolean;
  };
  buildStatusTaskLocator: {
    id: string;
    links: {
      status: string;
    };
  };
};
