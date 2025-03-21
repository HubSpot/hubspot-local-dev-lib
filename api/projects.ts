import { http } from '../http';
import fs from 'fs';
import { FormData, HubSpotPromise, QueryParams } from '../types/Http';
import {
  Project,
  FetchProjectResponse,
  UploadProjectResponse,
  ProjectSettings,
  FetchPlatformVersionResponse,
  WarnLogsResponse,
  UploadIRResponse,
} from '../types/Project';
import { Build, FetchProjectBuildsResponse } from '../types/Build';
import {
  ComponentStructureResponse,
  ProjectComponentsMetadata,
} from '../types/ComponentStructure';
import { Deploy, ProjectDeployResponse } from '../types/Deploy';
import {
  MigrateAppResponse,
  CloneAppResponse,
  PollAppResponse,
} from '../types/Migration';

const PROJECTS_API_PATH = 'dfs/v1/projects';
const DEVELOPER_FILE_SYSTEM_PATH = 'dfs/v1';
const PROJECTS_DEPLOY_API_PATH = 'dfs/deploy/v1';
const PROJECTS_DEPLOY_API_PATH_V3 = 'dfs/deploy/v3';
const PROJECTS_LOGS_API_PATH = 'dfs/logging/v1';
const DEVELOPER_PROJECTS_API_PATH = 'developer/projects/v1';
const MIGRATIONS_API_PATH = 'dfs/migrations/v1';

const PROJECTS_V3_API_PATH = 'project-components-external/v3';

export function fetchProjects(
  accountId: number
): HubSpotPromise<FetchProjectResponse> {
  return http.get<FetchProjectResponse>(accountId, {
    url: DEVELOPER_PROJECTS_API_PATH,
  });
}

export function createProject(
  accountId: number,
  name: string
): HubSpotPromise<Project> {
  return http.post<Project>(accountId, {
    url: DEVELOPER_PROJECTS_API_PATH,
    data: {
      name,
    },
  });
}

export async function uploadProject(
  accountId: number,
  projectName: string,
  projectFile: string,
  uploadMessage: string,
  platformVersion?: string,
  intermediateRepresentation?: unknown
): HubSpotPromise<UploadProjectResponse | UploadIRResponse> {
  if (intermediateRepresentation) {
    const formData = {
      projectFilesZip: fs.createReadStream(projectFile),
      platformVersion,
      uploadRequest: JSON.stringify({
        ...intermediateRepresentation,
        projectName,
        buildMessage: uploadMessage,
      }),
    };

    const response = await http.post<UploadIRResponse>(accountId, {
      url: `${PROJECTS_V3_API_PATH}/upload/new-api`,
      timeout: 60_000,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Remap the response to match the expected shape
    response.data.buildId = response.data.createdBuildId;

    return response;
  }

  const formData: FormData = {
    file: fs.createReadStream(projectFile),
    uploadMessage,
  };
  if (platformVersion) {
    formData.platformVersion = platformVersion;
  }
  return http.post<UploadProjectResponse>(accountId, {
    url: `${PROJECTS_API_PATH}/upload/${encodeURIComponent(projectName)}`,
    timeout: 60_000,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function fetchProject(
  accountId: number,
  projectName: string
): HubSpotPromise<Project> {
  return http.get<Project>(accountId, {
    url: `${DEVELOPER_PROJECTS_API_PATH}/by-name/${encodeURIComponent(projectName)}`,
  });
}

export async function fetchProjectComponentsMetadata(
  accountId: number,
  projectId: number
): HubSpotPromise<ProjectComponentsMetadata> {
  return http.get(accountId, {
    url: `${DEVELOPER_FILE_SYSTEM_PATH}/projects-deployed-build/${projectId}`,
  });
}

export async function downloadProject(
  accountId: number,
  projectName: string,
  buildId: number
): HubSpotPromise<Buffer> {
  return http.get<Buffer>(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/archive-full`,
    responseType: 'arraybuffer',
    headers: { accept: 'application/zip', 'Content-Type': 'application/json' },
  });
}

export function deleteProject(
  accountId: number,
  projectName: string
): HubSpotPromise<void> {
  return http.delete(accountId, {
    url: `${DEVELOPER_PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
  });
}

export function fetchPlatformVersions(
  accountId: number
): HubSpotPromise<FetchPlatformVersionResponse> {
  return http.get<FetchPlatformVersionResponse>(accountId, {
    url: `${DEVELOPER_PROJECTS_API_PATH}/platformVersion`,
  });
}

export function fetchProjectBuilds(
  accountId: number,
  projectName: string,
  params: QueryParams = {}
): HubSpotPromise<FetchProjectBuildsResponse> {
  return http.get<FetchProjectBuildsResponse>(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/builds`,
    params,
  });
}

export function getBuildStatus(
  accountId: number,
  projectName: string,
  buildId: number
): HubSpotPromise<Build> {
  return http.get<Build>(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/status`,
  });
}

export function getBuildStructure(
  accountId: number,
  projectName: string,
  buildId: number
): HubSpotPromise<ComponentStructureResponse> {
  return http.get<ComponentStructureResponse>(accountId, {
    url: `dfs/v1/builds/by-project-name/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/structure`,
  });
}

export function deployProject(
  accountId: number,
  projectName: string,
  buildId: number,
  useNewDeployApi = false
): HubSpotPromise<ProjectDeployResponse> {
  if (useNewDeployApi) {
    return http.post<ProjectDeployResponse>(accountId, {
      url: `${PROJECTS_DEPLOY_API_PATH_V3}/deploys/queue/async`,
      data: {
        projectName,
        targetBuildId: buildId,
      },
    });
  }
  return http.post<ProjectDeployResponse>(accountId, {
    url: `${PROJECTS_DEPLOY_API_PATH}/deploys/queue/async`,
    data: {
      projectName,
      buildId,
    },
  });
}

export function getDeployStatus(
  accountId: number,
  projectName: string,
  deployId: number
): HubSpotPromise<Deploy> {
  return http.get<Deploy>(accountId, {
    url: `${PROJECTS_DEPLOY_API_PATH}/deploy-status/projects/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}`,
  });
}

export function getDeployStructure(
  accountId: number,
  projectName: string,
  deployId: number
): HubSpotPromise<ComponentStructureResponse> {
  return http.get<ComponentStructureResponse>(accountId, {
    url: `${PROJECTS_DEPLOY_API_PATH}/deploys/by-project-name/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}/structure`,
  });
}

export function fetchProjectSettings(
  accountId: number,
  projectName: string
): HubSpotPromise<ProjectSettings> {
  return http.get<ProjectSettings>(accountId, {
    url: `${DEVELOPER_PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/settings`,
  });
}

export async function provisionBuild(
  accountId: number,
  projectName: string,
  platformVersion?: string
): HubSpotPromise<Build> {
  return http.post<Build>(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/provision`,
    params: { platformVersion },
    headers: { 'Content-Type': 'application/json' },
    timeout: 50_000,
  });
}

export function queueBuild(
  accountId: number,
  projectName: string,
  platformVersion?: string
): HubSpotPromise<void> {
  return http.post(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/queue`,
    params: { platformVersion },
    headers: { 'Content-Type': 'application/json' },
  });
}

export function uploadFileToBuild(
  accountId: number,
  projectName: string,
  filePath: string,
  path: string
): HubSpotPromise<void> {
  return http.put(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/files/${encodeURIComponent(path)}`,
    data: {
      file: fs.createReadStream(filePath),
    },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function deleteFileFromBuild(
  accountId: number,
  projectName: string,
  path: string
): HubSpotPromise<void> {
  return http.delete(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/files/${encodeURIComponent(path)}`,
  });
}

export function cancelStagedBuild(
  accountId: number,
  projectName: string
): HubSpotPromise<void> {
  return http.post(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/cancel`,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function fetchBuildWarnLogs(
  accountId: number,
  projectName: string,
  buildId: number
): HubSpotPromise<WarnLogsResponse> {
  return http.get<WarnLogsResponse>(accountId, {
    url: `${PROJECTS_LOGS_API_PATH}/logs/projects/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/combined/warn`,
  });
}

export function fetchDeployWarnLogs(
  accountId: number,
  projectName: string,
  deployId: number
): HubSpotPromise<WarnLogsResponse> {
  return http.get<WarnLogsResponse>(accountId, {
    url: `${PROJECTS_LOGS_API_PATH}/logs/projects/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}/combined/warn`,
  });
}

export interface MigrationStageOneResponse {
  migrationId: number;
  uidsRequired: string[];
}
export interface ListAppsMigrationComponent {
  id: string;
  componentType: string;
  isSupported: boolean;
}

export const UNMIGRATABLE_REASONS = {
  UP_TO_DATE: 'UP_TO_DATE',
  IS_A_PRIVATE_APP: 'IS_A_PRIVATE_APP',
  LISTED_IN_MARKETPLACE: 'LISTED_IN_MARKETPLACE',
};

interface BaseMigrationApp {
  appId: number;
  appName: string;
  isMigratable: boolean;
  migrationComponents: ListAppsMigrationComponent[];
  unmigratableReason: keyof typeof UNMIGRATABLE_REASONS | string | null;
}

export interface MigratableApp extends BaseMigrationApp {
  isMigratable: true;
  unmigratableReason: null;
}

export interface UnmigratableApp extends BaseMigrationApp {
  isMigratable: false;
}

export type MigrationApp = MigratableApp | UnmigratableApp;

export interface ListAppsResponse {
  migratableApps: MigratableApp[];
  unmigratableApps: UnmigratableApp[];
}

export async function listAppsForMigration(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  portalId: number
): Promise<ListAppsResponse> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        migratableApps: [
          {
            appId: 1,
            appName: 'App - 3',
            isMigratable: true,
            migrationComponents: [],
            unmigratableReason: null,
          },
          {
            appId: 2,
            appName: 'App - 2',
            isMigratable: true,
            migrationComponents: [],
            unmigratableReason: null,
          },
        ],
        unmigratableApps: [
          {
            appId: 3,
            appName: 'App 3 ',
            isMigratable: false,
            migrationComponents: [],
            unmigratableReason: 'UP_TO_DATE',
          },
        ],
      });
    }, 150);
  });
}

export async function beginMigration(
  appId: number
): Promise<MigrationStageOneResponse> {
  return new Promise(resolve => {
    setTimeout(() => {
      if (appId === 1) {
        return resolve({
          migrationId: 1234,
          uidsRequired: [
            'App 1',
            'Serverless function 1',
            'Serverless function 2',
          ],
        });
      }
      resolve({
        migrationId: 1234,
        uidsRequired: [],
      });
    }, 1500);
  });
}

type MigrationFinishResponse = {
  projectName: string;
  buildId: number;
};

export async function finishMigration(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  portalId: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  migrationId: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uidMap: Record<string, string>,
  projectName: string
): Promise<MigrationFinishResponse> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        projectName,
        buildId: 1234,
      });
    }, 2000);
  });
}

export function migrateNonProjectApp_v2023_2(
  accountId: number,
  appId: number,
  projectName: string
): HubSpotPromise<MigrateAppResponse> {
  return http.post<MigrateAppResponse>(accountId, {
    url: `${MIGRATIONS_API_PATH}/migrations`,
    data: {
      componentId: appId,
      componentType: 'PUBLIC_APP_ID',
      projectName,
    },
  });
}

export function checkMigrationStatus(
  accountId: number,
  id: number
): HubSpotPromise<PollAppResponse> {
  return http.get<PollAppResponse>(accountId, {
    url: `${MIGRATIONS_API_PATH}/migrations/${id}`,
  });
}

export function cloneApp(
  accountId: number,
  appId: number
): HubSpotPromise<CloneAppResponse> {
  return http.post<CloneAppResponse>(accountId, {
    url: `${MIGRATIONS_API_PATH}/exports`,
    data: {
      componentId: appId,
      componentType: 'PUBLIC_APP_ID',
    },
  });
}

export function checkCloneStatus(
  accountId: number,
  exportId: number
): HubSpotPromise<CloneAppResponse> {
  return http.get<CloneAppResponse>(accountId, {
    url: `${MIGRATIONS_API_PATH}/exports/${exportId}/status`,
  });
}

export function downloadClonedProject(
  accountId: number,
  exportId: number
): HubSpotPromise<Buffer> {
  return http.get<Buffer>(accountId, {
    url: `${MIGRATIONS_API_PATH}/exports/${exportId}/download-as-clone`,
    responseType: 'arraybuffer',
  });
}
