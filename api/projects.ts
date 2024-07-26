import { AxiosPromise } from 'axios';
import { http } from '../http';
import fs from 'fs';
import { FormData, QueryParams } from '../types/Http';
import {
  Project,
  FetchProjectResponse,
  UploadProjectResponse,
  ProjectSettings,
} from '../types/Project';
import { Build, FetchProjectBuildsResponse } from '../types/Build';
import {
  ComponentMetadataResponse,
  ComponentStructureResponse,
} from '../types/ComponentStructure';
import { Deploy, ProjectDeployResponse } from '../types/Deploy';
import { ProjectLog } from '../types/ProjectLog';
import {
  MigrateAppResponse,
  CloneAppResponse,
  PollAppResponse,
} from '../types/Migration';

const PROJECTS_API_PATH = 'dfs/v1/projects';
const PROJECTS_DEPLOY_API_PATH = 'dfs/deploy/v1';
const PROJECTS_LOGS_API_PATH = 'dfs/logging/v1';
const DEVELOPER_PROJECTS_API_PATH = 'developer/projects/v1';
const MIGRATIONS_API_PATH = 'dfs/migrations/v1';

export function fetchProjects(
  accountId: number
): AxiosPromise<FetchProjectResponse> {
  return http.get<FetchProjectResponse>(accountId, {
    url: PROJECTS_API_PATH,
  });
}

export function createProject(
  accountId: number,
  name: string
): AxiosPromise<Project> {
  return http.post<Project>(accountId, {
    url: PROJECTS_API_PATH,
    data: {
      name,
    },
  });
}

export function uploadProject(
  accountId: number,
  projectName: string,
  projectFile: string,
  uploadMessage: string,
  platformVersion?: string
): AxiosPromise<UploadProjectResponse> {
  const formData: FormData = {
    file: fs.createReadStream(projectFile),
    uploadMessage,
  };
  if (platformVersion) {
    formData.platformVersion = platformVersion;
  }

  return http.post<UploadProjectResponse>(accountId, {
    url: `${PROJECTS_API_PATH}/upload/${encodeURIComponent(projectName)}`,
    timeout: 60000,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function fetchProject(
  accountId: number,
  projectName: string
): AxiosPromise<Project> {
  return http.get<Project>(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
  });
}

export function downloadProject(
  accountId: number,
  projectName: string,
  buildId: number
): AxiosPromise<Buffer> {
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
): AxiosPromise<void> {
  return http.delete(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
  });
}

type FetchPlatformVersionResponse = {
  defaultPlatformVersion: string;
  activePlatformVersions: Array<string>;
};

export function fetchPlatformVersions(
  accountId: number
): AxiosPromise<FetchPlatformVersionResponse> {
  return http.get<FetchPlatformVersionResponse>(accountId, {
    url: `${DEVELOPER_PROJECTS_API_PATH}/platformVersion`,
  });
}

export function fetchProjectBuilds(
  accountId: number,
  projectName: string,
  params: QueryParams = {}
): AxiosPromise<FetchProjectBuildsResponse> {
  return http.get<FetchProjectBuildsResponse>(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/builds`,
    params,
  });
}

export function getBuildStatus(
  accountId: number,
  projectName: string,
  buildId: number
): AxiosPromise<Build> {
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
): AxiosPromise<ComponentStructureResponse> {
  return http.get<ComponentStructureResponse>(accountId, {
    url: `dfs/v1/builds/by-project-name/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/structure`,
  });
}

export function deployProject(
  accountId: number,
  projectName: string,
  buildId: number
): AxiosPromise<ProjectDeployResponse> {
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
): AxiosPromise<Deploy> {
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
): AxiosPromise<ComponentStructureResponse> {
  return http.get<ComponentStructureResponse>(accountId, {
    url: `${PROJECTS_DEPLOY_API_PATH}/deploys/by-project-name/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}/structure`,
  });
}

export function fetchProjectSettings(
  accountId: number,
  projectName: string
): AxiosPromise<ProjectSettings> {
  return http.get<ProjectSettings>(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/settings`,
  });
}

export function fetchDeployComponentsMetadata(
  accountId: number,
  projectId: number
): AxiosPromise<ComponentMetadataResponse> {
  return http.get<ComponentMetadataResponse>(accountId, {
    url: `${PROJECTS_API_PATH}/by-id/${projectId}/deploy-components-metadata`,
  });
}

export function provisionBuild(
  accountId: number,
  projectName: string,
  platformVersion?: string
): AxiosPromise<Build> {
  return http.post<Build>(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/provision`,
    params: { platformVersion },
    headers: { 'Content-Type': 'application/json' },
    timeout: 50000,
  });
}

export function queueBuild(
  accountId: number,
  projectName: string,
  platformVersion?: string
): AxiosPromise<void> {
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
): AxiosPromise<void> {
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
): AxiosPromise<void> {
  return http.delete(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/files/${encodeURIComponent(path)}`,
  });
}

export function cancelStagedBuild(
  accountId: number,
  projectName: string
): AxiosPromise<void> {
  return http.post(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/cancel`,
    headers: { 'Content-Type': 'application/json' },
  });
}

type WarnLogsResponse = {
  logs: Array<ProjectLog>;
};

export function fetchBuildWarnLogs(
  accountId: number,
  projectName: string,
  buildId: number
): AxiosPromise<WarnLogsResponse> {
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
): AxiosPromise<WarnLogsResponse> {
  return http.get<WarnLogsResponse>(accountId, {
    url: `${PROJECTS_LOGS_API_PATH}/logs/projects/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}/combined/warn`,
  });
}

export function migrateApp(
  accountId: number,
  appId: number,
  projectName: string
): AxiosPromise<MigrateAppResponse> {
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
): AxiosPromise<PollAppResponse> {
  return http.get<PollAppResponse>(accountId, {
    url: `${MIGRATIONS_API_PATH}/migrations/${id}`,
  });
}

export function cloneApp(
  accountId: number,
  appId: number
): AxiosPromise<CloneAppResponse> {
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
): AxiosPromise<CloneAppResponse> {
  return http.get<CloneAppResponse>(accountId, {
    url: `${MIGRATIONS_API_PATH}/exports/${exportId}/status`,
  });
}

export function downloadClonedProject(
  accountId: number,
  exportId: number
): AxiosPromise<Buffer> {
  return http.get<Buffer>(accountId, {
    url: `${MIGRATIONS_API_PATH}/exports/${exportId}/download-as-clone`,
    responseType: 'arraybuffer',
  });
}
