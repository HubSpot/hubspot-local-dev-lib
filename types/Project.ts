import type { Build } from './Build.js';
import { GithubSourceData } from './Github.js';
import { ProjectLog } from './ProjectLog.js';

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

export type UploadIRResponse = {
  buildId?: number;
  createdBuildId: number;
};

export type ProjectSettings = {
  isAutoDeployEnabled: boolean;
};

export type FetchPlatformVersionResponse = {
  defaultPlatformVersion: string;
  activePlatformVersions: Array<string>;
};

export type WarnLogsResponse = {
  logs: Array<ProjectLog>;
};
