import { Build } from './Build';
import { GithubSourceData } from './Github';
import { ProjectLog } from './ProjectLog';

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

export type ProjectSettings = {
  isAutoDeployEnabled: boolean;
};

export type FetchPlatformVersionResponse = {
  defaultPlatformVersion: string;
  activePlatformVersions: Array<string>;
};

export type ProjectStandardError = {
  status: string;
  id?: string;
  category: string;
  subCategory?: string;
  message?: string;
  errors?: Array<{
    message: string;
    in?: string;
    code?: string;
    subcateogy?: string;
    context: object;
  }>;
  context: object;
  links: { [key: string]: string };
};

export type WarnLogsResponse = {
  logs: Array<ProjectLog>;
};
