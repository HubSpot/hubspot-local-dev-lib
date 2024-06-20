import http from '../http';
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
import { MigrateAppResponse, PollAppResponse } from '../types/Migration';

const PROJECTS_API_PATH = 'dfs/v1/projects';
const PROJECTS_DEPLOY_API_PATH = 'dfs/deploy/v1';
const PROJECTS_LOGS_API_PATH = 'dfs/logging/v1';
const DEVELOPER_PROJECTS_API_PATH = 'developer/projects/v1';
const MIGRATIONS_API_PATH = 'dfs/migrations/v1';

export async function fetchProjects(
  accountId: number
): Promise<FetchProjectResponse> {
  return http.get(accountId, {
    url: PROJECTS_API_PATH,
  });
}

export async function createProject(
  accountId: number,
  name: string
): Promise<Project> {
  return http.post(accountId, {
    url: PROJECTS_API_PATH,
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
  platformVersion?: string
): Promise<UploadProjectResponse> {
  const formData: FormData = {
    file: fs.createReadStream(projectFile),
    uploadMessage,
  };
  if (platformVersion) {
    formData.platformVersion = platformVersion;
  }

  return http.post(accountId, {
    url: `${PROJECTS_API_PATH}/upload/${encodeURIComponent(projectName)}`,
    timeout: 60000,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function fetchProject(
  accountId: number,
  projectName: string
): Promise<Project> {
  return http.get(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
  });
}

export async function downloadProject(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<Buffer> {
  return http.get(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/archive-full`,
    responseType: 'arraybuffer',
    headers: { accept: 'application/zip', 'Content-Type': 'application/json' },
  });
}

export async function deleteProject(
  accountId: number,
  projectName: string
): Promise<void> {
  return http.delete(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}`,
  });
}

type FetchPlatformVersionResponse = {
  defaultPlatformVersion: string;
  activePlatformVersions: Array<string>;
};

export async function fetchPlatformVersions(
  accountId: number
): Promise<FetchPlatformVersionResponse> {
  return http.get(accountId, {
    url: `${DEVELOPER_PROJECTS_API_PATH}/platformVersion`,
  });
}

export async function fetchProjectBuilds(
  accountId: number,
  projectName: string,
  params: QueryParams = {}
): Promise<FetchProjectBuildsResponse> {
  return http.get(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/builds`,
    params,
  });
}

export async function getBuildStatus(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<Build> {
  return http.get(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/status`,
  });
}

export async function getBuildStructure(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<ComponentStructureResponse> {
  return http.get(accountId, {
    url: `dfs/v1/builds/by-project-name/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/structure`,
  });
}

export async function getBuildDisplayStructure(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<ComponentStructureResponse> {
  return http.get(accountId, {
    url: `dfs/v1/builds/by-project-name/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/display-structure`,
  });
}

export async function deployProject(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<ProjectDeployResponse> {
  return http.post(accountId, {
    url: `${PROJECTS_DEPLOY_API_PATH}/deploys/queue/async`,
    data: {
      projectName,
      buildId,
    },
  });
}

export async function getDeployStatus(
  accountId: number,
  projectName: string,
  deployId: number
): Promise<Deploy> {
  return http.get(accountId, {
    url: `${PROJECTS_DEPLOY_API_PATH}/deploy-status/projects/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}`,
  });
}

export async function getDeployStructure(
  accountId: number,
  projectName: string,
  deployId: number
): Promise<ComponentStructureResponse> {
  return http.get(accountId, {
    url: `${PROJECTS_DEPLOY_API_PATH}/deploys/by-project-name/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}/structure`,
  });
}

export async function fetchProjectSettings(
  accountId: number,
  projectName: string
): Promise<ProjectSettings> {
  return http.get(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(projectName)}/settings`,
  });
}

export async function fetchDeployComponentsMetadata(
  accountId: number,
  projectId: number
): Promise<ComponentMetadataResponse> {
  return http.get(accountId, {
    url: `${PROJECTS_API_PATH}/by-id/${projectId}/deploy-components-metadata`,
  });
}

export async function provisionBuild(
  accountId: number,
  projectName: string,
  platformVersion?: string
): Promise<Build> {
  return http.post(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/provision`,
    params: { platformVersion },
    headers: { 'Content-Type': 'application/json' },
    timeout: 50000,
  });
}

export async function queueBuild(
  accountId: number,
  projectName: string,
  platformVersion?: string
): Promise<void> {
  return http.post(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/queue`,
    params: { platformVersion },
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function uploadFileToBuild(
  accountId: number,
  projectName: string,
  filePath: string,
  path: string
): Promise<void> {
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

export async function deleteFileFromBuild(
  accountId: number,
  projectName: string,
  path: string
): Promise<void> {
  return http.delete(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/files/${encodeURIComponent(path)}`,
  });
}

export async function cancelStagedBuild(
  accountId: number,
  projectName: string
): Promise<void> {
  return http.post(accountId, {
    url: `${PROJECTS_API_PATH}/${encodeURIComponent(
      projectName
    )}/builds/staged/cancel`,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function fetchBuildWarnLogs(
  accountId: number,
  projectName: string,
  buildId: number
): Promise<{ logs: Array<ProjectLog> }> {
  return http.get(accountId, {
    url: `${PROJECTS_LOGS_API_PATH}/logs/projects/${encodeURIComponent(
      projectName
    )}/builds/${buildId}/combined/warn`,
  });
}

export async function fetchDeployWarnLogs(
  accountId: number,
  projectName: string,
  deployId: number
): Promise<{ logs: Array<ProjectLog> }> {
  return http.get(accountId, {
    url: `${PROJECTS_LOGS_API_PATH}/logs/projects/${encodeURIComponent(
      projectName
    )}/deploys/${deployId}/combined/warn`,
  });
}

export async function migrateApp(
  accountId: number,
  appId: number,
  projectName: string
): Promise<MigrateAppResponse> {
  return http.post(accountId, {
    url: `${MIGRATIONS_API_PATH}/migrations`,
    data: {
      componentId: appId,
      componentType: 'PUBLIC_APP_ID',
      projectName,
    },
  });
}

export async function checkMigrationStatus(
  accountId: number,
  id: number
): Promise<PollAppResponse> {
  return http.get(accountId, {
    url: `${MIGRATIONS_API_PATH}/migrations/${id}`,
  });
}
