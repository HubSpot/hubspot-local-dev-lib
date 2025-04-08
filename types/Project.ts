import { Build } from './Build';
import { GithubSourceData } from './Github';
import { ProjectLog } from './ProjectLog';
import { UNMIGRATABLE_REASONS } from '../constants/projects';

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

interface BaseMigrationApp {
  appId: number;
  appName: string;
  isMigratable: boolean;
  migrationComponents: ListAppsMigrationComponent[];
  projectName?: string;
}

export interface MigratableApp extends BaseMigrationApp {
  isMigratable: true;
}

export interface UnmigratableApp extends BaseMigrationApp {
  isMigratable: false;
  unmigratableReason: keyof typeof UNMIGRATABLE_REASONS;
}

export type MigrationApp = MigratableApp | UnmigratableApp;

export interface ListAppsResponse {
  migratableApps: MigratableApp[];
  unmigratableApps: UnmigratableApp[];
}

export interface InitializeMigrationResponse {
  migrationId: number;
}

export interface ListAppsMigrationComponent {
  id: string;
  componentType: string;
  isSupported: boolean;
}

export type ContinueMigrationResponse = {
  migrationId: number;
};
